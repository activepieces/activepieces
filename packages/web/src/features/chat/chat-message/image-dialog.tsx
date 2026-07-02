import { t } from 'i18next';
import { Download, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import ImageWithFallback from '@/components/custom/image-with-fallback';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { downloadImage } from './download-image';

export const ImageDialog: React.FC<ImageDialogProps> = ({
  open,
  onOpenChange,
  imageUrl,
  images,
  startIndex = 0,
}) => {
  const slides = images ?? (imageUrl ? [{ url: imageUrl }] : []);
  const close = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-auto max-w-[90vw] items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]"
      >
        <DialogTitle className="sr-only">{t('Image preview')}</DialogTitle>
        {slides.length > 1 ? (
          <GalleryViewer
            slides={slides}
            startIndex={startIndex}
            onClose={close}
          />
        ) : (
          <SingleViewer url={slides[0]?.url ?? ''} onClose={close} />
        )}
      </DialogContent>
    </Dialog>
  );
};

function SingleViewer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="relative flex items-center justify-center">
      <ImageWithFallback
        src={url}
        alt={t('Image preview')}
        className="max-h-[85vh] max-w-[90vw] h-auto w-auto rounded-md object-contain"
      />
      <div className="absolute right-3 top-3">
        <ViewerControls
          onDownload={() => url && downloadImage(url)}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function GalleryViewer({
  slides,
  startIndex,
  onClose,
}: {
  slides: ImageSlide[];
  startIndex: number;
  onClose: () => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const slide = slides[current];
  return (
    <div className="relative w-[90vw] max-w-5xl">
      <Carousel
        setApi={setApi}
        opts={{ startIndex, loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((item, index) => (
            <CarouselItem
              key={`${item.url}-${index}`}
              className="flex items-center justify-center"
            >
              <ImageWithFallback
                src={item.url}
                alt={item.caption ?? t('Image preview')}
                className="max-h-[85vh] h-auto w-auto rounded-md object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious variant="accent" className="left-3" />
        <CarouselNext variant="accent" className="right-3" />
      </Carousel>
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
          {current + 1} / {slides.length}
        </span>
        <ViewerControls
          onDownload={() => slide?.url && downloadImage(slide.url)}
          onClose={onClose}
        />
      </div>
      {slide?.caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
          <span className="max-w-[80%] truncate rounded-full bg-black/55 px-3 py-1 text-xs text-white">
            {slide.caption}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ViewerControls({
  onDownload,
  onClose,
}: {
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="icon"
        variant="accent"
        title={t('Download')}
        onClick={onDownload}
      >
        <Download className="h-4 w-4" />
        <span className="sr-only">{t('Download')}</span>
      </Button>
      <Button size="icon" variant="accent" title={t('Close')} onClick={onClose}>
        <X className="h-4 w-4" />
        <span className="sr-only">{t('Close')}</span>
      </Button>
    </div>
  );
}

type ImageSlide = { url: string; caption?: string };

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string | null;
  images?: ImageSlide[];
  startIndex?: number;
}
