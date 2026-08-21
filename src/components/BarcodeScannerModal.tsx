import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Flashlight,
  RefreshCw,
  Camera,
  Search,
  AlertCircle,
  CheckCircle2,
  Zap,
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

  // Focus ripple animation
  const [focusRipple, setFocusRipple] = useState<{ x: number; y: number } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isDetectedRef = useRef<boolean>(false);
  const readerElementId = 'istiqomah-barcode-reader';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
        setTorchOn(false);
        setTorchSupported(false);
        setZoomRange(null);
      }
    }
  }, []);

  const handleDetected = useCallback(
    (decodedText: string) => {
      if (isDetectedRef.current) return;
      isDetectedRef.current = true;

      const cleaned = decodedText.trim();
      setSuccessCode(cleaned);

      // Instant pleasant audio beep & tactile haptic vibration
      soundEffects.playScanBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 25, 40]);
      }

      // Quick smooth delay for visual confirmation
      setTimeout(async () => {
        await stopScanner();
        onScan(cleaned);
        onClose();
      }, 220);
    },
    [stopScanner, onScan, onClose]
  );

  const checkCapabilities = useCallback(() => {
    if (!scannerRef.current) return;
    try {
      // Query capabilities from html5-qrcode running track
      const capabilities = scannerRef.current.getRunningTrackCapabilities() as MediaTrackCapabilities & {
        zoom?: { min: number; max: number; step: number };
        torch?: boolean;
      };

      if (capabilities) {
        // 1. Torch / Flashlight check
        if ('torch' in capabilities || (capabilities as Record<string, unknown>).fillLightMode) {
          setTorchSupported(true);
        }

        // 2. Hardware Zoom check
        if (capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min) {
          setZoomRange({
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step || 0.1,
          });
          setCurrentZoom(capabilities.zoom.min || 1);
        }
      }
    } catch (e) {
      console.warn('Capabilities query note:', e);
    }
  }, []);

  const startScanner = useCallback(
    async (overrideCamId?: string) => {
      setCameraError(null);
      isDetectedRef.current = false;
      setSuccessCode(null);

      try {
        if (scannerRef.current) {
          await stopScanner();
        }

        // 1. Pre-warm camera permission test stream for reliable hardware access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280, min: 640, max: 1920 },
                height: { ideal: 720, min: 480, max: 1080 },
              },
            });
            stream.getTracks().forEach((track) => track.stop());
          } catch (permErr) {
            console.warn('Direct media permission test:', permErr);
          }
        }

        // 2. Enumerate available cameras
        let cameras: Array<{ id: string; label: string }> = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          setCameraList(cameras);
        } catch (camErr) {
          console.warn('getCameras query:', camErr);
        }

        // 3. Initialize Html5Qrcode instance with hardware acceleration BarcodeDetector
        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417,
          ],
          verbose: false,
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });

        scannerRef.current = html5QrCode;

        // 4. Ultra-responsive high FPS config with wide aspect ratio for retail barcodes
        const scanConfig = {
          fps: 28, // High framerate for instant scan lock
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
            const height = Math.min(Math.floor(viewfinderHeight * 0.56), 210);
            return {
              width: Math.max(width, 180),
              height: Math.max(height, 120),
            };
          },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640, max: 1920 },
            height: { ideal: 720, min: 480, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            advanced: [
              { focusMode: 'continuous' },
              { exposureMode: 'continuous' },
              { whiteBalanceMode: 'continuous' },
            ],
          } as unknown as MediaTrackConstraints,
        };

        // 5. Smart camera device selection
        let targetCamera: string | MediaTrackConstraints = {
          facingMode: { ideal: facingMode },
        };

        const storedCamId = localStorage.getItem(PREFERRED_CAMERA_KEY);
        const camToUse = overrideCamId || selectedCameraId || storedCamId;

        if (cameras.length > 0) {
          // Check if requested or stored camera exists
          const existingCam = cameras.find((c) => c.id === camToUse);
          if (existingCam) {
            targetCamera = existingCam.id;
            setSelectedCameraId(existingCam.id);
          } else {
            // Find best rear camera (prefer main lens over ultrawide)
            const rearCamIndex = cameras.findIndex((c) => {
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

            if (facingMode === 'environment' && rearCamIndex >= 0) {
              targetCamera = cameras[rearCamIndex].id;
              setSelectedCameraId(cameras[rearCamIndex].id);
            } else {
              targetCamera = cameras[0].id;
              setSelectedCameraId(cameras[0].id);
            }
          }
        }

        // Start hardware camera stream
        await html5QrCode.start(
          targetCamera,
          scanConfig,
          (decodedText) => handleDetected(decodedText),
          () => {}
        );

        setIsScanning(true);

        // Check camera capabilities (torch, hardware zoom)
        setTimeout(() => {
          checkCapabilities();
        }, 300);
      } catch (err) {
        console.error('Camera startup error:', err);
        setCameraError(
          'Kamera belum aktif atau izin ditolak. Pastikan izin kamera telah disetujui, atau masukkan barcode manual di bawah.'
        );
        setIsScanning(false);
      }
    },
    [facingMode, selectedCameraId, handleDetected, stopScanner, checkCapabilities]
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  // Camera Switch Handler
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
      }, 120);
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      await stopScanner();
      setTimeout(() => {
        startScanner();
      }, 120);
    }
  };

  // Torch / Flashlight Handler
  const handleToggleTorch = async () => {
    soundEffects.playClickSound();
    if (scannerRef.current && isScanning) {
      try {
        const nextTorch = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Torch constraint toggle note:', err);
      }
    }
  };

  // Hardware Zoom Handler (1x, 1.5x, 2x, etc.)
  const handleSetZoom = async (zoomValue: number) => {
    soundEffects.playClickSound();
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ zoom: zoomValue } as MediaTrackConstraintSet],
        });
        setCurrentZoom(zoomValue);
      } catch (err) {
        console.warn('Hardware zoom application note:', err);
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
    }, 600);

    // Re-prompt camera autofocus
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
        } as unknown as MediaTrackConstraints);
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

  // Compute available zoom presets
  const availableZoomPresets = zoomRange
    ? [1, 1.5, 2, 3].filter(
        (z) => z >= zoomRange.min && z <= zoomRange.max + 0.05
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 modal-backdrop animate-in fade-in duration-150">
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
                Akselerasi hardware aktif • Instant scan
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
          <div id={readerElementId} className="w-full h-full" />

          {/* Scanner Overlay Guide & Laser Animation */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Reticle bounding box */}
              <div
                className={`w-[85%] max-w-[310px] h-[55%] max-h-[190px] rounded-2xl relative transition-all duration-200 ${
                  successCode
                    ? 'border-2 border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(52,211,153,0.6)]'
                    : 'border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
                }`}
              >
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-white rounded-br-lg" />

                {/* Animated Laser Sweep Line */}
                {!successCode && (
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-laser-sweep" />
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
                    Arahkan barcode ke dalam bingkai
                  </span>
                </div>
              )}
            </div>
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
              <AlertCircle size={32} className="mx-auto text-amber-400 animate-pulse" />
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
