"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

type Banner = { src: string; alt: string };

type BannerCarouselProps = {
  banners: Banner[];
  autoPlay?: boolean;
  interval?: number;
};

export default function BannerCarousel({
  banners,
  autoPlay = false,
  interval = 6000
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [enableTransition, setEnableTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slides = useMemo(() => {
    if (banners.length <= 1) return banners;
    return [banners[banners.length - 1], ...banners, banners[0]];
  }, [banners]);

  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    Math.max(0, slides.length - 1)
  );

  useEffect(() => {
    if (banners.length <= 1) {
      setCurrentIndex(0);
      setEnableTransition(false);
      return;
    }
    setCurrentIndex(1);
    setEnableTransition(true);
  }, [banners.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    if (currentIndex < 0 || currentIndex > slides.length - 1) {
      setEnableTransition(false);
      setCurrentIndex(slides.length > 1 ? 1 : 0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true));
      });
    }
  }, [currentIndex, slides.length]);

  const goNext = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((index) => index + 1);
  };

  const goPrev = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((index) => index - 1);
  };

  useEffect(() => {
    if (!autoPlay || banners.length <= 1 || isPaused) return;
    const timer = setInterval(goNext, interval);
    return () => clearInterval(timer);
  }, [autoPlay, banners.length, interval, isPaused]);

  const handleTransitionEnd = () => {
    if (banners.length <= 1) return;
    if (currentIndex === slides.length - 1) {
      setEnableTransition(false);
      setCurrentIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true));
      });
      return;
    }
    if (currentIndex === 0) {
      setEnableTransition(false);
      setCurrentIndex(slides.length - 2);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true));
      });
    }
  };

  const activeDot = (() => {
    if (banners.length <= 1) return 0;
    if (currentIndex === 0) return banners.length - 1;
    if (currentIndex === slides.length - 1) return 0;
    return currentIndex - 1;
  })();

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  if (banners.length === 0) return null;

  if (banners.length === 1) {
    return (
      <div className="relative overflow-hidden border border-surface-200 bg-surface-50 shadow-soft">
        <div className="relative h-44 sm:h-52 md:h-60 lg:h-72 xl:h-80">
          <Image
            src={banners[0].src}
            alt={banners[0].alt}
            fill
            priority
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-contain object-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden border border-surface-200 bg-surface-50 shadow-soft"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-44 sm:h-52 md:h-60 lg:h-72 xl:h-80">
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${safeIndex * 100}%)`,
            transition: enableTransition ? "transform 500ms ease-in-out" : "none"
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((banner, index) => (
            <div
              key={`${banner.src}-${index}`}
              className="relative h-full w-full flex-none min-w-full"
            >
              <Image
                src={banner.src}
                alt={banner.alt}
                fill
                priority={index === 1}
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* <button
        type="button"
        onClick={goPrev}
        className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-900 shadow-sm backdrop-blur transition hover:bg-white"
        aria-label="Previous banner"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-900 shadow-sm backdrop-blur transition hover:bg-white"
        aria-label="Next banner"
      >
        <ChevronRight className="h-5 w-5" />
      </button> */}

      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={banner.src}
            type="button"
            onClick={() => setCurrentIndex(index + 1)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              index === activeDot ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
