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
  }
}; 