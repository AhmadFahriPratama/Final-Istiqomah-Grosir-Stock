import React, { useState } from 'react';
import { X, Copy, Check, Share2, FileText } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface TextReportModalProps {
  isOpen: boolean;
  title: string;
  reportText: string;
  onClose: () => void;
}

export const TextReportModal: React.FC<TextReportModalProps> = ({
  isOpen,
  title,
  reportText,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    soundEffects.playClickSound();
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    soundEffects.playClickSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: reportText,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 my-auto flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-black" />
            <h3 className="text-xs font-bold text-black truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content area */}
        <div className="p-3.5 overflow-y-auto flex-1">
          <textarea
            readOnly
            value={reportText}
            rows={12}
            className="w-full p-3 text-[11px] font-mono leading-relaxed bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none select-all text-black"
          />
        </div>

        {/* Actions */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Tersalin!' : 'Salin Teks'}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
          >
            <Share2 size={13} /> Bagikan
          </button>
        </div>
      </div>
    </div>
  );
};
