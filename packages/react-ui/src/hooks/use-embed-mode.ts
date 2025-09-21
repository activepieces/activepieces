import { useMemo } from 'react';

export const useEmbedMode = () => {
  const isEmbedMode = useMemo(() => {
    // Check for SWS_EMBED_MODE environment variable
    const embedMode = import.meta.env.VITE_SWS_EMBED_MODE;
    return embedMode === 'true' || embedMode === '1';
  }, []);

  return { isEmbedMode };
};
