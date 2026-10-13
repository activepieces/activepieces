import { piecesHooks } from '@/features/pieces';

export function usePrefetchPiecesSection() {
  piecesHooks.usePrefetchPlatformCatalog();
  piecesHooks.usePrefetchPieces({});
}
