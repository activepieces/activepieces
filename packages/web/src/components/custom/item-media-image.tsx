import { colorsUtils } from '@/lib/color-utils';

import { ItemMedia } from './item';

function ItemMediaImage({ src, alt }: ItemMediaImageProps) {
  const backgroundColor = colorsUtils.useAverageColorInImage({
    imgUrl: src,
    transparency: 10,
  });

  return (
    <ItemMedia
      variant="icon"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <img src={src} alt={alt} className="size-6" />
    </ItemMedia>
  );
}

type ItemMediaImageProps = {
  src: string;
  alt: string;
};

export { ItemMediaImage };
