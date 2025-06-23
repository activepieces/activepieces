import { useSuspenseQuery } from '@tanstack/react-query';

import { useEmbedding } from '@/components/embed-provider';
import { api } from '@/lib/api';
import { isNil } from '@activepieces/shared';
const defaultFont = 'Roboto';
const useDownloadEmbeddingFont = () => {
  const { embedState } = useEmbedding();
  useSuspenseQuery<string, Error>({
    queryKey: ['font', embedState.fontFamily, embedState.fontUrl],
    queryFn: async () => {
      try {
        if (
          embedState.isEmbedded &&
          !isNil(embedState.fontUrl) &&
          !isNil(embedState.fontFamily)
        ) {
          return api.get(embedState.fontUrl).then(() => {
            const link = document.createElement('link');
            link.href = embedState.fontUrl!;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            const fontFamilySplit = embedState
              .fontFamily!.split(',')
              .map((font) => `"${font}"`)
              .join(',');
            document.body.style.fontFamily = `${fontFamilySplit}, Roboto, sans-serif`;
            return embedState.fontFamily!;
          });
        }
        if (
          embedState.isEmbedded &&
          ((isNil(embedState.fontUrl) && !isNil(embedState.fontFamily)) ||
            (isNil(embedState.fontFamily) && !isNil(embedState.fontUrl)))
        ) {
          console.warn('fontUrl or fontFamily is not set, using default font', {
            fontUrl: embedState.fontUrl,
            fontFamily: embedState.fontFamily,
          });
        }
      } catch (error) {
        console.error(error);
        return defaultFont;
      }
      return defaultFont;
    },
  });
};
const EmbeddingFontLoader = ({ children }: { children: React.ReactNode }) => {
  useDownloadEmbeddingFont();

  return <>{children}</>;
};

EmbeddingFontLoader.displayName = 'EmbeddingFontLoader';

export { EmbeddingFontLoader };
