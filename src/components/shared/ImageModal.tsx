import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// Placeholder image for failed loads
const ERROR_IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage Not Found%3C/text%3E%3C/svg%3E';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ url: string; name: string; id: string }>;
  currentIndex: number;
  onNavigate?: (index: number) => void;
}

export function ImageModal({ isOpen, onClose, images, currentIndex, onNavigate }: ImageModalProps) {
  const [index, setIndex] = useState(currentIndex);
  
  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        const newIndex = index - 1;
        setIndex(newIndex);
        onNavigate?.(newIndex);
      } else if (e.key === 'ArrowRight' && index < images.length - 1) {
        const newIndex = index + 1;
        setIndex(newIndex);
        onNavigate?.(newIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, index, images.length, onClose, onNavigate]);

  if (!images[index]) return null;

  const currentImage = images[index];
  const hasPrevious = index > 0;
  const hasNext = index < images.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      const newIndex = index - 1;
      setIndex(newIndex);
      onNavigate?.(newIndex);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const newIndex = index + 1;
      setIndex(newIndex);
      onNavigate?.(newIndex);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden">
        <div className="relative bg-black/90 flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 bg-card/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-medium truncate pr-4">
                {currentImage.name}
              </DialogTitle>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            {images.length > 1 && (
              <div className="text-xs text-muted-foreground">
                {index + 1} of {images.length}
              </div>
            )}
          </DialogHeader>

          {/* Image Container */}
          <div className="relative flex items-center justify-center p-4 min-h-[400px] max-h-[calc(95vh-80px)]">
            <img
              src={currentImage.url}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = ERROR_IMAGE_PLACEHOLDER;
              }}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card backdrop-blur-sm"
                >
                  <ArrowLeft className="w-5 h-5" weight="bold" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card backdrop-blur-sm"
                >
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
