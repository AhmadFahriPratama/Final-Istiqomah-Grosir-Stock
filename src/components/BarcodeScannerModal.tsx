import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Flashlight,
  RefreshCw,
  Camera,
  Search,
  CheckCircle2,
  Zap,
  CameraOff,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

interface ZoomCapability {
  min: number;
  max: number;
  step: number;
}

const PREFERRED_CAMERA_KEY = 'istiqomah_preferred_camera_id';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / QR',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraList, setCameraList] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Hardware Zoom Support
  const [zoomRange, setZoomRange] = useState<ZoomCapability | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1);

  // Success Feedback
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  // Focus ripple animation
  const [focusRipple, setFocusRipple] = useState<{ x: number; y: number } | null>(null);

  // Direct Hardware Video & Native Detector Refs (Adapted from Istiqomah-Price)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<unknown>(null);
  const isDetectingRef = useRef<boolean>(false);
  const isDetectedRef = useRef<boolean>(false);
  const stoppedRef = useRef<boolean>(false);
  const frameCallbackIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fallback Html5Qrcode scanner ref for devices without BarcodeDetector
  const fallbackScannerRef = useRef<Html5Qrcode | null>(null);
  const fallbackElementId = 'istiqomah-barcode-fallback-reader';
  const [useFallbackEngine, setUseFallbackEngine] = useState<boolean>(false);

  // Cleanup helper
  const stopScanner = useCallback(async () => {
    stoppedRef.current = true;
    isDetectingRef.current = false;

    // 1. Cancel animation / frame callbacks
    if (frameCallbackIdRef.current !== null && videoRef.current && 'cancelVideoFrameCallback' in videoRef.current) {
      try {
        (videoRef.current as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(
          frameCallbackIdRef.current
        );
      } catch {
        // silent
      }
      frameCallbackIdRef.current = null;
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // 2. Stop camera stream tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn('Stream stop note:', err);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 3. Clean up fallback scanner if active
    if (fallbackScannerRef.current) {
      try {
        if (fallbackScannerRef.current.isScanning) {
          await fallbackScannerRef.current.stop();
        }
        await fallbackScannerRef.current.clear();
      } catch (err) {
        console.warn('Fallback scanner stop note:', err);
      } finally {
        fallbackScannerRef.current = null;
      }
    }

    setIsScanning(false);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomRange(null);
  }, []);

  // Handle successful detection
  const handleDetected = useCallback(
    (decodedText: string) => {
      if (isDetectedRef.current) return;
      isDetectedRef.current = true;

      const cleaned = decodedText.trim();
      setSuccessCode(cleaned);
      setFlash(true);
      setTimeout(() => setFlash(false), 220);

      // Play instant pleasant 2-tone audio & haptic vibration
      soundEffects.playScanBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }

      // Smooth brief confirmation before handing over and closing
      setTimeout(async () => {
        await stopScanner();
        onScan(cleaned);
        onClose();
      }, 240);
    },
    [stopScanner, onScan, onClose]
  );

  // Inspect stream capabilities (torch, hardware zoom)
  const checkTrackCapabilities = useCallback((track: MediaStreamTrack) => {
    try {
      if (typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
          zoom?: { min: number; max: number; step: number };
          torch?: boolean;
        };

        if (capabilities) {
          if ('torch' in capabilities || (capabilities as Record<string, unknown>).fillLightMode) {
            setTorchSupported(true);
          }

          if (capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min) {
            setZoomRange({
              min: capabilities.zoom.min,
              max: capabilities.zoom.max,
              step: capabilities.zoom.step || 0.1,
            });
            setCurrentZoom(capabilities.zoom.min || 1);
          }
        }
      }
    } catch (e) {
      console.warn('Track capability check note:', e);
    }
  }, []);

  // Frame detection loop using Istiqomah-Price high performance crop algorithm
  const startHighSpeedDetectionLoop = useCallback(() => {
    const scheduleNextFrame = () => {
      if (stoppedRef.current) return;
      const video = videoRef.current;

      if (video && typeof (video as unknown as { requestVideoFrameCallback: unknown }).requestVideoFrameCallback === 'function') {
        frameCallbackIdRef.current = (
          video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }
        ).requestVideoFrameCallback(() => {
          if (!stoppedRef.current) {
            detectFrame();
          }
        });
      } else {
        timeoutIdRef.current = setTimeout(detectFrame, 16); // ~60fps
      }
    };

    const detectFrame = async () => {
      if (stoppedRef.current || isDetectedRef.current) return;

      if (isDetectingRef.current) {
        scheduleNextFrame();
        return;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        scheduleNextFrame();
        return;
      }

      isDetectingRef.current = true;

      try {
        // === HIGH-PERFORMANCE CROPPING (Adapted directly from Istiqomah-Price) ===
        // Crop center 72% Width x 42% Height region matching the physical reticle frame
        // 4x to 10x faster than full-frame analysis on mobile devices
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cropW = Math.floor(vw * 0.72);
        const cropH = Math.floor(vh * 0.42);
        const sx = Math.floor((vw - cropW) / 2);
        const sy = Math.floor((vh - cropH) / 2);

        let barcodes: Array<{ rawValue: string }> = [];

        const detector = detectorRef.current as { detect: (src: ImageBitmap | HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

        if (detector) {
          const supportsCrop = typeof createImageBitmap === 'function' && createImageBitmap.length >= 5;
          if (supportsCrop) {
            try {
              const bitmap = await createImageBitmap(video, sx, sy, cropW, cropH);
              barcodes = await detector.detect(bitmap);
              bitmap.close();
            } catch {
              // Fallback to direct video element if bitmap crop errors
              try {
                barcodes = await detector.detect(video);
              } catch {
                // Ignore transient frame decode error
              }
            }
          } else {
            try {
              barcodes = await detector.detect(video);
            } catch {
              // Ignore transient frame decode error
            }
          }
        }

        if (barcodes && barcodes.length > 0) {
          const detectedCode = barcodes[0].rawValue;
          if (detectedCode) {
            handleDetected(detectedCode);
            return;
          }
        }
      } catch (err) {
        console.warn('Frame detection step error:', err);
      } finally {
        isDetectingRef.current = false;
      }

      scheduleNextFrame();
    };

    scheduleNextFrame();
  }, [handleDetected]);

  // Main scanner startup logic
  const startScanner = useCallback(
    async (overrideCamId?: string) => {
      setCameraError(null);
      isDetectedRef.current = false;
      stoppedRef.current = false;
      setSuccessCode(null);

      await stopScanner();
      stoppedRef.current = false;

      // 1. Check if native BarcodeDetector is available (Chrome 83+, Edge, Android Webview)
      const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

      // 2. Enumerate video input devices
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          cameras = devices
            .filter((d) => d.kind === 'videoinput')
            .map((d, index) => ({
              id: d.deviceId,
              label: d.label || `Kamera ${index + 1}`,
            }));
          setCameraList(cameras);
        }
      } catch (err) {
        console.warn('enumerateDevices note:', err);
      }

      if (hasBarcodeDetector) {
        // === MODE A: ISTIQOMAH-PRICE NATIVE HIGH-SPEED PIPELINE ===
        setUseFallbackEngine(false);

        try {
          // Initialize BarcodeDetector once
          const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts: unknown) => unknown }).BarcodeDetector;
          detectorRef.current = new BarcodeDetectorClass({
            formats: [
              'ean_13',
              'ean_8',
              'code_128',
              'code_39',
              'code_93',
              'upc_a',
              'upc_e',
              'itf',
              'codabar',
              'qr_code',
              'data_matrix',
            ],
          });

          // Camera constraints: 720p/1080p rear camera
          const storedCamId = localStorage.getItem(PREFERRED_CAMERA_KEY);
          const camToUse = overrideCamId || selectedCameraId || storedCamId;

          let videoConstraint: MediaTrackConstraints = {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640, max: 1920 },
            height: { ideal: 720, min: 480, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
          };

          if (camToUse && cameras.some((c) => c.id === camToUse)) {
            videoConstraint = {
              deviceId: { exact: camToUse },
              width: { ideal: 1280, min: 640, max: 1920 },
              height: { ideal: 720, min: 480, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
            };
            setSelectedCameraId(camToUse);
          } else if (cameras.length > 0) {
            const rearCam = cameras.find((c) => {
              const lbl = c.label.toLowerCase();
              return (
                lbl.includes('back') ||
                lbl.includes('rear') ||
                lbl.includes('environment') ||
                lbl.includes('belakang') ||
                lbl.includes('0, facing back') ||
                lbl.includes('main')
              );
            });
            if (facingMode === 'environment' && rearCam) {
              videoConstraint = {
                deviceId: { exact: rearCam.id },
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
              };
              setSelectedCameraId(rearCam.id);
            }
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: false,
          });

          if (stoppedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch((playErr) => console.warn('Video play note:', playErr));
          }

          // Check torch & zoom capabilities on active video track
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            checkTrackCapabilities(videoTrack);
          }

          // Pre-warm BarcodeDetector with dummy detection to eliminate first-frame lag
          try {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              const dummyBitmap = await createImageBitmap(videoRef.current);
              const detector = detectorRef.current as { detect: (b: ImageBitmap) => Promise<unknown> };
              await detector.detect(dummyBitmap);
              dummyBitmap.close();
            }
          } catch {
            // Ignore pre-warm errors
          }

          setIsScanning(true);
          startHighSpeedDetectionLoop();
        } catch (err: unknown) {
          console.warn('Native camera stream failed, falling back to Html5Qrcode:', err);
          startFallbackScanner(overrideCamId);
        }
      } else {
        // === MODE B: FALLBACK HTML5QRCODE PIPELINE ===
        startFallbackScanner(overrideCamId);
      }
    },
    [
      facingMode,
      selectedCameraId,
      stopScanner,
      checkTrackCapabilities,
      startHighSpeedDetectionLoop,
    ]
  );

  // Fallback Html5Qrcode engine for older browsers
  const startFallbackScanner = async (overrideCamId?: string) => {
    setUseFallbackEngine(true);
    try {
      const html5QrCode = new Html5Qrcode(fallbackElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      fallbackScannerRef.current = html5QrCode;

      const scanConfig = {
        fps: 25,
        qrbox: (w: number, h: number) => ({
          width: Math.max(Math.floor(w * 0.85), 180),
          height: Math.max(Math.floor(h * 0.5), 120),
        }),
        aspectRatio: 1.0,
      };

      const storedCamId = localStorage.getItem(PREFERRED_CAMERA_KEY);
      const camToUse = overrideCamId || selectedCameraId || storedCamId;

      const cameraParam = camToUse ? camToUse : { facingMode };

      await html5QrCode.start(
        cameraParam,
        scanConfig,
        (decodedText) => handleDetected(decodedText),
        () => {}
      );

      setIsScanning(true);
    } catch (fallbackErr) {
      console.error('Fallback camera error:', fallbackErr);
      setCameraError(
        'Kamera belum aktif atau izin ditolak. Pastikan izin kamera telah disetujui, atau masukkan barcode secara manual.'
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  // Flip Camera Lens Handler
  const handleFlipCamera = async () => {
    soundEffects.playClickSound();
    if (cameraList.length > 1) {
      const currentIndex = cameraList.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameraList.length;
      const nextCam = cameraList[nextIndex];
      setSelectedCameraId(nextCam.id);
      localStorage.setItem(PREFERRED_CAMERA_KEY, nextCam.id);
      await stopScanner();
      setTimeout(() => {
        startScanner(nextCam.id);
      }, 100);
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      await stopScanner();
      setTimeout(() => {
        startScanner();
      }, 100);
    }
  };

  // Flashlight / Torch Toggle Handler
  const handleToggleTorch = async () => {
    soundEffects.playClickSound();
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && isScanning) {
      try {
        const nextTorch = !torchOn;
        // Apply torch constraint
        await track.applyConstraints({
          advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch constraint toggle note:', err);
      }
    } else if (fallbackScannerRef.current && isScanning) {
      try {
        const nextTorch = !torchOn;
        await fallbackScannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Fallback torch toggle note:', err);
      }
    }
  };

  // Hardware Zoom Handler (1x, 1.5x, 2x)
  const handleSetZoom = async (zoomValue: number) => {
    soundEffects.playClickSound();
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && isScanning) {
      try {
        await track.applyConstraints({
          advanced: [{ zoom: zoomValue } as MediaTrackConstraintSet],
        });
        setCurrentZoom(zoomValue);
      } catch (err) {
        console.warn('Hardware zoom note:', err);
      }
    }
  };

  // Tap-to-Focus Handler
  const handleViewfinderClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusRipple({ x, y });

    setTimeout(() => {
      setFocusRipple(null);
    }, 550);

    const track = streamRef.current?.getVideoTracks()[0];
    if (track && isScanning) {
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
        });
      } catch {
        // silent fallback
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetected(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  const availableZoomPresets = zoomRange
    ? [1, 1.5, 2, 3].filter((z) => z >= zoomRange.min && z <= zoomRange.max + 0.05)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
              <Camera size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">{title}</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Istiqomah Ultra-Fast Scanner • Instant Lock
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Camera Section */}
        <div
          onClick={handleViewfinderClick}
          className="relative bg-black aspect-square flex flex-col items-center justify-center overflow-hidden cursor-crosshair select-none"
        >
          {/* Native Direct Hardware Video */}
          {!useFallbackEngine ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div id={fallbackElementId} className="w-full h-full" />
          )}

          {/* Scanner Overlay Guide & Laser Animation */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Reticle bounding box matching the 72% x 42% high-performance detection crop */}
              <div
                className={`w-[85%] max-w-[310px] h-[55%] max-h-[190px] rounded-2xl relative transition-all duration-200 ${
                  successCode
                    ? 'border-2 border-emerald-400 bg-emerald-500/25 shadow-[0_0_25px_rgba(52,211,153,0.7)]'
                    : 'border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.60)]'
                }`}
              >
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-white rounded-br-lg" />

                {/* Animated Laser Sweep Line */}
                {!successCode && (
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-laser-sweep" />
                )}

                {/* Success Indicator Overlay */}
                {successCode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 backdrop-blur-xs rounded-2xl animate-in zoom-in-90 duration-150">
                    <CheckCircle2 size={36} className="text-emerald-400 drop-shadow-md mb-1 animate-bounce" />
                    <span className="text-xs font-mono font-bold tracking-wider bg-black/80 px-2 py-0.5 rounded-md border border-emerald-400/40">
                      {successCode}
                    </span>
                  </div>
                )}
              </div>

              {!successCode && (
                <div className="mt-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                  <Zap size={11} className="text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-200">
                    Arahkan barcode produk ke dalam bingkai
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Flash Effect on Detection */}
          {flash && (
            <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-[2px] pointer-events-none transition-opacity duration-150" />
          )}

          {/* Tap-to-Focus Ripple Indicator */}
          {focusRipple && (
            <div
              className="absolute pointer-events-none w-10 h-10 border-2 border-yellow-400 rounded-lg animate-focus-ripple"
              style={{
                left: `${focusRipple.x - 20}px`,
                top: `${focusRipple.y - 20}px`,
              }}
            />
          )}

          {/* Camera Error State */}
          {cameraError && (
            <div className="p-6 text-center text-white space-y-3 z-10">
              <CameraOff size={32} className="mx-auto text-amber-400 animate-pulse" />
              <p className="text-xs text-zinc-300 leading-relaxed max-w-[260px] mx-auto">
                {cameraError}
              </p>
              <button
                onClick={() => startScanner()}
                className="mt-2 px-4 py-2 bg-white text-black text-xs font-bold rounded-xl touch-press shadow-md hover:bg-zinc-100"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Top Floating Controls (Flash, Camera Switch) */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            {/* Flashlight Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTorch();
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all touch-press ${
                torchOn
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                  : 'bg-black/60 text-white/90 hover:bg-black/80 hover:text-white border border-white/10'
              }`}
              title={torchSupported ? 'Senter / Flash' : 'Toggle Senter'}
            >
              <Flashlight size={14} className={torchOn ? 'fill-current' : ''} />
            </button>

            {/* Camera Switcher Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFlipCamera();
              }}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:bg-black/80 hover:text-white border border-white/10 transition-all touch-press"
              title="Ganti Lensa Kamera"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Bottom Zoom Controls (1x, 1.5x, 2x) */}
          {availableZoomPresets.length > 1 && (
            <div className="absolute bottom-2.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
              {availableZoomPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetZoom(preset);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all touch-press ${
                    Math.abs(currentZoom - preset) < 0.1
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual Barcode Input Section */}
        <div className="p-3.5 bg-white border-t border-zinc-100">
          <form onSubmit={handleManualSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik kode barcode manual..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono font-bold transition-colors"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl touch-press shadow-sm"
            >
              Cari
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
