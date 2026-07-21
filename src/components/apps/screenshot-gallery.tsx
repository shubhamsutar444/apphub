"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        next();
      } else {
        prev();
      }
    }
    setTouchStart(null);
  };

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <>
      {/* Horizontal Screenshot Cards */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide">
        {screenshots.map((ss, i) => (
          <button
            key={ss.id}
            type="button"
            onClick={() => openLightbox(i)}
            className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all hover:ring-2 hover:ring-primary/60 sm:h-60 sm:w-34"
          >
            <Image
              src={ss.url}
              alt={`Screenshot ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="140px"
            />
            {/* Zoom overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <ZoomIn className="h-7 w-7 text-white drop-shadow-md" />
            </div>
          </button>
        ))}
      </div>

      {/* Swipeable Fullscreen Lightbox Modal via Portal to body */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {lightboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black/95 p-4 backdrop-blur-md"
                onClick={closeLightbox}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Header Toolbar */}
                <div className="flex w-full items-center justify-between z-10 px-2 pt-2 sm:px-6">
                  <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur border border-white/10">
                    {activeIndex + 1} / {screenshots.length}
                  </div>
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Interactive Swipeable Image Container */}
                <div className="relative flex flex-1 items-center justify-center w-full my-auto overflow-hidden">
                  {/* Prev Button */}
                  {screenshots.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); prev(); }}
                      className="absolute left-2 sm:left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25 hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}

                  {/* Swipeable Image */}
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, { offset }) => {
                      if (offset.x < -60) next();
                      if (offset.x > 60) prev();
                    }}
                    className="relative cursor-grab active:cursor-grabbing flex items-center justify-center p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshots[activeIndex].url}
                      alt={`Screenshot ${activeIndex + 1}`}
                      className="max-h-[70vh] max-w-[85vw] md:max-h-[76vh] md:max-w-[420px] w-auto h-auto rounded-2xl object-contain shadow-2xl ring-1 ring-white/15 select-none"
                    />
                  </motion.div>

                  {/* Next Button */}
                  {screenshots.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); next(); }}
                      className="absolute right-2 sm:right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/25 hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                </div>

                {/* Bottom Carousel Navigation Bar */}
                {screenshots.length > 1 && (
                  <div className="z-10 flex flex-col items-center gap-2 pb-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 max-w-[90vw] overflow-x-auto p-1 scrollbar-hide">
                      {screenshots.map((ss, i) => (
                        <button
                          key={ss.id}
                          type="button"
                          onClick={() => setActiveIndex(i)}
                          className={`relative h-12 w-8 shrink-0 overflow-hidden rounded-lg transition-all ${
                            i === activeIndex
                              ? "ring-2 ring-primary scale-105 opacity-100"
                              : "opacity-40 hover:opacity-75"
                          }`}
                        >
                          <Image src={ss.url} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="36px" />
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-secondary-400">Swipe or use arrows to navigate</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
