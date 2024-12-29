import { findRelevantPieces } from './embeddings';

// =================== Shared Tool Functions ===================
export const toolFunctions = {
  findRelevantPieces: async (params: { prompt: string, threshold?: number }) => {
    console.debug('[PieceFinder] Finding relevant pieces for prompt:', params.prompt);
    try {
      const pieces = await findRelevantPieces(params.prompt, params.threshold);
      return pieces.map((piece) => ({
        pieceName: piece.metadata.pieceName,
        content: piece.content,
        logoUrl: piece.metadata.logoUrl || '',
        relevanceScore: piece.similarity || 0,
      }));
    } catch (error) {
      console.error('[PieceFinder] Error finding relevant pieces:', error);
      throw new Error('Failed to find relevant pieces');
    }
  },

  fetchPieceMetadata: async (params: { pieceName: string }) => {
    console.debug('[PieceMetadata] Fetching metadata for piece:', params.pieceName);
    try {
      const response = await fetch(`https://cloud.activepieces.com/api/v1/pieces/${params.pieceName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch piece metadata: ${response.statusText}`);
      }
      const metadata = await response.json();
      return {
        name: metadata.name,
        displayName: metadata.displayName,
        description: metadata.description,
        version: metadata.version,
        actions: metadata.actions,
        triggers: metadata.triggers,
        auth: metadata.auth,
        logoUrl: metadata.logoUrl,
        projectUsage: metadata.projectUsage,
        pieceType: metadata.pieceType,
        packageType: metadata.packageType,
        categories: metadata.categories,
        minimumSupportedRelease: metadata.minimumSupportedRelease,
        maximumSupportedRelease: metadata.maximumSupportedRelease
      };
    } catch (error) {
      console.error('[PieceMetadata] Error fetching piece metadata:', error);
      throw new Error('Failed to fetch piece metadata');
    }
  }
}; 