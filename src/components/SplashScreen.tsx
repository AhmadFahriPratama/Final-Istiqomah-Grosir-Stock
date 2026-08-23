import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 80);
    const t2 = setTimeout(() => setIsFadingOut(true), 700);
    const t3 = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#f5eedc] flex items-center justify-center select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`text-center transition-all duration-500 ease-out ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        <h1 className="text-xl font-extrabold text-[#2a1a10] tracking-tight">
          Istiqomah Stock
        </h1>
        <p className="text-xs text-[#78604d] mt-1 font-medium">
          by Fahri Pratama
        </p>
      </div>
    </div>
  );
};
