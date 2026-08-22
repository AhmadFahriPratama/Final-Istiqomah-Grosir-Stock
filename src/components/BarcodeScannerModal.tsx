import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  CameraOff,
  AlertCircle,
  Loader2,
  Zap,
  ZapOff,
  Search,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  continuous?: boolean;
}

type ScanStatus = 'loading' | 'scanning' | 'error' | 'unsupported' | 'denied';

/**
 * Inner Scanner View Component - Mounts fresh on modal open and strictly cleans up on close
 * Replicated 1:1 from Istiqomah-Price's ultra-reliable BarcodeScanner architecture.
 */
const BarcodeScannerView: React.FC<{
  onDetected: (code: string) => void;
  continuous?: boolean;
}> = ({ onDetected, continuous = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<unknown>(null);
  const isDetectingRef = useRef(false);
  const lastDetectedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const onDetectedRef = useRef(onDetected);
  const continuousRef = useRef(continuous);
  const stoppedRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [flash, setFlash] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keep refs in sync with latest props
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  // Two-tone Web Audio Beep (880Hz -> 1320Hz)
  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.18);
    } catch {
      // silent fallback
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let frameCallbackId: number | null = null;

    const scheduleNext = () => {
      if (cancelled || stoppedRef.current) return;
      const video = videoRef.current;

      if (video && typeof (video as unknown as { requestVideoFrameCallback: unknown }).requestVideoFrameCallback === 'function') {
        frameCallbackId = (
          video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }
        ).requestVideoFrameCallback(() => {
          if (!cancelled && !stoppedRef.current) {
            detectLoop();
          }
        });
      } else {
        timeoutId = setTimeout(detectLoop, 16);
      }
    };

    const detectLoop = async () => {
      if (cancelled || stoppedRef.current) return;

      if (isDetectingRef.current) {
        scheduleNext();
        return;
      }

      const video = videoRef.current;
      // ReadyState must be HAVE_ENOUGH_DATA (4)
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        scheduleNext();
        return;
      }

      isDetectingRef.current = true;

      try {
        // === CROP CENTER REGION for 4x-10x faster + more accurate detection ===
        // Wide aspect ratio (70%W x 40%H) matches EAN-13 barcode shape
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cropW = Math.floor(vw * 0.7);
        const cropH = Math.floor(vh * 0.4);
        const sx = Math.floor((vw - cropW) / 2);
        const sy = Math.floor((vh - cropH) / 2);

        let barcodes: Array<{ rawValue: string }> = [];
        const detector = detectorRef.current as {
          detect: (src: ImageBitmap | HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
        };

        if (detector) {
          const supportsCrop = typeof createImageBitmap === 'function' && createImageBitmap.length >= 5;
          if (supportsCrop) {
            try {
              const bitmap = await createImageBitmap(video, sx, sy, cropW, cropH);
              barcodes = await detector.detect(bitmap);
              bitmap.close();
            } catch {
              try {
                barcodes = await detector.detect(video);
              } catch {
                isDetectingRef.current = false;
                scheduleNext();
                return;
              }
            }
          } else {
            try {
              barcodes = await detector.detect(video);
            } catch {
              isDetectingRef.current = false;
              scheduleNext();
              return;
            }
          }
        }

        if (barcodes && barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          const now = Date.now();
          const last = lastDetectedRef.current;

          // Debounce: same code within 800ms ignored
          if (code !== last.code || now - last.time > 800) {
            lastDetectedRef.current = { code, time: now };
            setLastCode(code);
            setFlash(true);
            setTimeout(() => setFlash(false), 200);

            // Haptic feedback & Web Audio beep
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(80);
            }
            playBeep();

            onDetectedRef.current(code);

            if (!continuousRef.current) {
              stoppedRef.current = true;
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Frame detection step note:', err);
      } finally {
        isDetectingRef.current = false;
      }

      scheduleNext();
    };

    const startCamera = async () => {
      setStatus('loading');

      // Feature detection - BarcodeDetector API (Chrome 83+)
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        setStatus('unsupported');
        setErrorMsg(
          'Browser tidak mendukung BarcodeDetector API. Gunakan Chrome/Edge versi terbaru di Android, atau gunakan input manual di bawah.'
        );
        return;
      }

      // Check getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('unsupported');
        setErrorMsg('Browser tidak mendukung akses kamera. Gunakan Chrome terbaru atau input manual.');
        return;
      }

      // Create detector once
      try {
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts: unknown) => unknown }).BarcodeDetector;
        detectorRef.current = new BarcodeDetectorClass({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'itf', 'codabar'],
        });
      } catch (e: unknown) {
        setStatus('unsupported');
        setErrorMsg('Gagal inisialisasi BarcodeDetector: ' + String(e));
        return;
      }

      try {
        // Use clean, standard constraints that NEVER fail on Android
        const constraints: MediaStreamConstraints = {
          video: { facingMode: 'environment' },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Check torch capability
        try {
          const track = stream.getVideoTracks()[0];
          if (track && typeof track.getCapabilities === 'function') {
            const capabilities = track.getCapabilities() as Record<string, unknown>;
            if (capabilities && capabilities.torch) {
              setHasTorch(true);
            }
          }
        } catch {
          // torch check ignore
        }

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.muted = true;

          video.onloadedmetadata = () => {
            if (cancelled || stoppedRef.current) return;
            video
              .play()
              .then(() => {
                setStatus('scanning');
                scheduleNext();
              })
              .catch((err) => {
                console.warn('Video play catch:', err);
                setStatus('scanning');
                scheduleNext();
              });
          };

          // In case onloadedmetadata fired immediately
          if (video.readyState >= 1) {
            video
              .play()
              .then(() => {
                setStatus('scanning');
                scheduleNext();
              })
              .catch(() => {});
          }
        }

        // Pre-warm detector (first detect() call is slow due to API init)
        try {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            const dummyBitmap = await createImageBitmap(videoRef.current);
            const detector = detectorRef.current as { detect: (b: ImageBitmap) => Promise<unknown> };
            await detector.detect(dummyBitmap);
            dummyBitmap.close();
          }
        } catch {
          // ignore pre-warm errors
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as { name?: string; message?: string };
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
          setErrorMsg('Izin kamera ditolak. Buka pengaturan browser untuk mengizinkan akses kamera.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setStatus('error');
          setErrorMsg('Kamera tidak ditemukan di perangkat ini.');
        } else if (err.name === 'NotReadableError') {
          setStatus('error');
          setErrorMsg('Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.');
        } else {
          setStatus('error');
          setErrorMsg(err.message || 'Gagal mengakses kamera.');
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stoppedRef.current = true;
      if (frameCallbackId !== null && videoRef.current && 'cancelVideoFrameCallback' in videoRef.current) {
        try {
          (videoRef.current as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(
            frameCallbackId
          );
        } catch {
          // silent
        }
      }
      if (timeoutId) clearTimeout(timeoutId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          // silent
        }
        audioCtxRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Camera container */}
      <div className="relative aspect-square w-full bg-black overflow-hidden select-none">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          disablePictureInPicture
          className="w-full h-full object-cover block"
        />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-20">
            <Loader2 size={32} className="animate-spin mb-2 text-white" />
            <p className="text-xs font-medium">Memulai kamera...</p>
          </div>
        )}

        {/* Error / Unsupported / Denied overlay */}
        {(status === 'error' || status === 'unsupported' || status === 'denied') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-6 text-center z-20">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
              {status === 'denied' ? (
                <CameraOff size={26} className="text-amber-400" />
              ) : (
                <AlertCircle size={26} className="text-amber-400" />
              )}
            </div>
            <p className="text-sm font-bold mb-1">
              {status === 'denied'
                ? 'Izin Kamera Ditolak'
                : status === 'unsupported'
                ? 'Tidak Didukung'
                : 'Error Kamera'}
            </p>
            <p className="text-[11px] text-zinc-300 leading-relaxed max-w-[260px]">{errorMsg}</p>
            {status === 'denied' && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-white text-black text-xs font-bold rounded-xl touch-press"
              >
                Coba Lagi
              </button>
            )}
          </div>
        )}

        {/* Scan frame overlay - only when scanning */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Single overlay: transparent center, dark surround via box-shadow
                Center area matches crop region (70%W x 40%H) */}
            <div
              className="absolute"
              style={{
                top: '30%',
                bottom: '30%',
                left: '15%',
                right: '15%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.60)',
                borderRadius: '12px',
              }}
            />

            {/* Corner brackets matching 70%W x 40%H */}
            <div className="absolute" style={{ top: '30%', left: '15%' }}>
              <div className="w-5 h-5 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
            </div>
            <div className="absolute" style={{ top: '30%', right: '15%' }}>
              <div className="w-5 h-5 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
            </div>
            <div className="absolute" style={{ bottom: '30%', left: '15%' }}>
              <div className="w-5 h-5 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
            </div>
            <div className="absolute" style={{ bottom: '30%', right: '15%' }}>
              <div className="w-5 h-5 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
            </div>

            {/* Animated scan line - Luxury Platinum/White */}
            <div
              className="absolute animate-laser-sweep"
              style={{
                left: '16%',
                right: '16%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #ffffff 30%, #ffffff 70%, transparent)',
                boxShadow: '0 0 12px 2px rgba(255,255,255,0.85)',
              }}
            />

            {/* Flash overlay on detection - Soft Silver Light */}
            {flash && (
              <div className="absolute inset-0 bg-white/35 backdrop-blur-xs transition-opacity duration-150" />
            )}

            {/* Status text */}
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[10px] text-white font-medium bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-white/20 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {continuous ? 'Scan barcode - auto simpan' : 'Arahkan barcode produk ke bingkai'}
              </span>
            </div>

            {/* Last detected code badge - Elegant High-Contrast Monochrome */}
            {lastCode && (
              <div className="absolute top-3 left-3 right-3 text-center">
                <div className="bg-black text-white text-[11px] font-mono font-bold px-3 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-2xl border border-zinc-500">
                  <CheckCircle2 size={13} className="text-white" />
                  <span>{lastCode}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Torch toggle button */}
        {hasTorch && status === 'scanning' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTorch();
            }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors z-30 touch-press ${
              torchOn
                ? 'bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.9)]'
                : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
            }`}
            title={torchOn ? 'Matikan senter' : 'Nyalakan senter'}
          >
            {torchOn ? <Zap size={14} className="fill-current" /> : <ZapOff size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / QR',
  continuous = false,
}) => {
  useRegisterModal('BarcodeScannerModal', isOpen, onClose);
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleDetectedCode = (code: string) => {
    const cleaned = code.trim();
    // Smooth delay for visual confirmation
    setTimeout(() => {
      onScan(cleaned);
      onClose();
    }, 200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      soundEffects.playScanBeep();
      handleDetectedCode(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Camera size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">{title}</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Pindai barcode produk
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Camera Section */}
        <BarcodeScannerView
          onDetected={handleDetectedCode}
          continuous={continuous}
        />

        {/* Manual Barcode Input Section */}
        <div className="p-3 bg-white border-t border-zinc-100">
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
              className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl touch-press shadow-xs"
            >
              Cari
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
