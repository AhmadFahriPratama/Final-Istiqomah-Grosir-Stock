import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Flashlight, RefreshCw, Camera, Search, AlertCircle } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraList, setCameraList] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<number>(0);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
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
      }
    }
  }, []);

  const handleDetected = useCallback((decodedText: string) => {
    soundEffects.playScanBeep();
    stopScanner();
    onScan(decodedText.trim());
    onClose();
  }, [stopScanner, onScan, onClose]);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      // 1. Explicitly request camera permissions if available in modern browsers / WebView
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
          });
          // Immediately release test stream so Html5Qrcode can bind to the camera
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr) {
          console.warn('Direct getUserMedia test:', permErr);
        }
      }

      // 2. Query available camera devices
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        setCameraList(cameras);
      } catch (camErr) {
        console.warn('getCameras error:', camErr);
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgePercentage = 0.75;
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * minEdgePercentage);
          return {
            width: qrboxSize,
            height: Math.floor(qrboxSize * 0.65),
          };
        },
        aspectRatio: 1.0,
      };

      // Select camera device or fallback to facingMode
      if (cameras.length > 0) {
        // Try finding back camera first
        let targetCamId = cameras[0].id;
        const rearCamIndex = cameras.findIndex(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment') ||
            c.label.toLowerCase().includes('belakang')
        );

        if (facingMode === 'environment' && rearCamIndex >= 0) {
          targetCamId = cameras[rearCamIndex].id;
          setSelectedCameraIndex(rearCamIndex);
        } else if (cameras[selectedCameraIndex]) {
          targetCamId = cameras[selectedCameraIndex].id;
        }

        await html5QrCode.start(
          targetCamId,
          config,
          (decodedText) => handleDetected(decodedText),
          () => {}
        );
      } else {
        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => handleDetected(decodedText),
          () => {}
        );
      }

      setIsScanning(true);
    } catch (err) {
      console.error('Camera start failed:', err);
      setCameraError(
        'Kamera belum aktif / izin ditolak. Pastikan izin kamera telah disetujui, atau masukkan barcode manual.'
      );
      setIsScanning(false);
    }
  }, [facingMode, selectedCameraIndex, handleDetected, stopScanner]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  const handleFlipCamera = async () => {
    soundEffects.playClickSound();
    if (cameraList.length > 1) {
      const nextIndex = (selectedCameraIndex + 1) % cameraList.length;
      setSelectedCameraIndex(nextIndex);
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
    }
    await stopScanner();
    setTimeout(() => {
      startScanner();
    }, 150);
  };

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
        console.warn('Torch not supported on this device:', err);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-black" />
            <h3 className="text-xs font-bold text-black">{title}</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Camera Section */}
        <div className="relative bg-black aspect-square flex flex-col items-center justify-center overflow-hidden">
          <div id={readerElementId} className="w-full h-full" />

          {/* Scanner Overlay Guide */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="w-56 h-36 border-2 border-dashed border-white rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white shadow-[0_0_6px_#fff] animate-pulse" />
              </div>
              <span className="mt-3 text-[10px] font-bold text-white bg-black/80 px-2.5 py-0.5 rounded-full">
                Arahkan ke barcode
              </span>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-white space-y-2">
              <AlertCircle size={28} className="mx-auto text-zinc-400" />
              <p className="text-xs text-zinc-300">{cameraError}</p>
              <button
                onClick={() => startScanner()}
                className="mt-2 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg touch-press"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={handleToggleTorch}
              className={`p-2 rounded-full transition-colors ${
                torchOn ? 'bg-white text-black font-bold' : 'bg-black/70 text-white'
              }`}
              title="Senter / Flash"
            >
              <Flashlight size={14} />
            </button>
            <button
              onClick={handleFlipCamera}
              className="p-2 rounded-full bg-black/70 text-white hover:text-white"
              title="Ganti Kamera"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Manual Barcode Input Section */}
        <div className="p-3.5 bg-white border-t border-zinc-100">
          <form onSubmit={handleManualSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik kode barcode..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
                autoFocus
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl touch-press"
            >
              Cari
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
