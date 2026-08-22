import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Fade in "Istiqomah Stock"
    const timerTitle = setTimeout(() => {
      setShowTitle(true);
    }, 100);

    // 2. Followed by "by Fahri Pratama"
    const timerSubtitle = setTimeout(() => {
      setShowSubtitle(true);
    }, 450);

    // 3. Fade out the whole screen
    const timerFadeOut = setTimeout(() => {
      setIsFadingOut(true);
    }, 1300);

    // 4. Complete and unmount
    const timerFinish = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 1750);

    return () => {
      clearTimeout(timerTitle);
      clearTimeout(timerSubtitle);
      clearTimeout(timerFadeOut);
      clearTimeout(timerFinish);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-100 bg-white flex flex-col items-center justify-center select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center space-y-1.5 px-4">
        {/* Main Title: Istiqomah Stock */}
        <h1
          className={`text-2xl sm:text-3xl font-black text-black tracking-tight font-sans transition-all duration-700 ease-out transform ${
            showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          Istiqomah Stock
        </h1>

        {/* Subtitle: by Fahri Pratama */}
        <p
          className={`text-xs sm:text-sm font-medium text-zinc-400 tracking-wide font-sans transition-all duration-700 ease-out transform ${
            showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          by Fahri Pratama
        </p>
      </div>
    </div>
  );
};
