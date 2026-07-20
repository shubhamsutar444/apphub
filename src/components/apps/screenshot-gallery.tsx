"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Screenshot {
  id: string;
  url: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
}

export function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? screenshots.length - 1 : i - 1));
  }, [screenshots.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i === screenshots.length - 1 ? 0 : i + 1));
  }, [screenshots.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, prev, next]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <>
      {/* Thumbnail strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {screenshots.map((ss, i) => (
          <button
            key={ss.id}
            type="button"
            onClick={() => openLightbox(i)}
            className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-2 hover:ring-primary/50 sm:h-56 sm:w-32"
          >
            <Image
              src={ss.url}
              alt={`Screenshot ${i + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="128px"
            />
            {/* Zoom hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-white drop-shadow" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur">
              {activeIndex + 1} / {screenshots.length}
            </div>

            {/* Prev button */}
            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative max-h-[85vh] max-w-[90vw] sm:max-w-[400px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={screenshots[activeIndex].url}
                alt={`Screenshot ${activeIndex + 1}`}
                width={400}
                height={800}
                className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
                priority
              />
            </motion.div>

            {/* Next button */}
            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Dot indicators */}
            {screenshots.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {screenshots.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    className={`h-2 rounded-full transition-all ${
                      i === activeIndex ? "w-6 bg-primary" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
