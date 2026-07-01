import { ImageGeneratedEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ImageDialog } from '@/features/chat/chat-message/image-dialog';
import { cn } from '@/lib/utils';

export function ImageCarouselGroup({
  images,
}: {
  images: ImageGeneratedEvent[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const active = images[current];
  const caption = active?.caption ?? active?.prompt ?? t('Generated image');
  const slides = images.map((image) => ({
    url: image.url,
    caption: image.caption ?? image.prompt,
  }));

  return (
    <motion.div
      className="@container max-w-md overflow-hidden rounded-xl border bg-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="relative">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={`${image.fileId}-${index}`}>
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="flex h-56 w-full cursor-pointer items-center justify-center bg-muted/40 @sm:h-72"
              >
                <img
                  src={image.url}
                  alt={image.caption ?? image.prompt ?? t('Generated image')}
                  className="max-h-full w-full object-contain"
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious variant="secondary" className="left-2" />
        <CarouselNext variant="secondary" className="right-2" />
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {current + 1} / {images.length}
        </span>
      </Carousel>

      <div className="flex items-center justify-between gap-2 p-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {caption}
        </p>
        <a href={active?.url} download target="_blank" rel="noreferrer">
          <Button variant="ghost" size="icon-sm">
            <Download className="size-4" />
          </Button>
        </a>
      </div>

      {images.length <= MAX_DOTS ? (
        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {images.map((image, index) => (
            <button
              key={`dot-${image.fileId}-${index}`}
              type="button"
              aria-label={t('chatImagePosition', {
                current: index + 1,
                total: images.length,
              })}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'size-1.5 rounded-full bg-muted-foreground/30 transition-colors',
                index === current && 'bg-muted-foreground/80',
              )}
            />
          ))}
        </div>
      ) : null}

      <ImageDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        images={slides}
        startIndex={current}
      />
    </motion.div>
  );
}

const MAX_DOTS = 8;
