import { Piece, PieceSegment } from './types';
import { v4 as uuidv4 } from 'uuid';

export function processPieces(pieces: Piece[]): PieceSegment[] {
  console.debug('Processing pieces into segments...');
  const segments: PieceSegment[] = [];

  for (const piece of pieces) {
    // Create description segment
    if (piece?.description) {
      segments.push({
        id: uuidv4(),
        content: `${piece.displayName || piece.name} is ${piece.description}`,
        metadata: {
          pieceId: piece.id,
          pieceName: piece.name,
          segmentType: 'description'
        }
      });
    }

    // Create auth segment if exists
    if (piece?.auth?.description) {
      segments.push({
        id: uuidv4(),
        content: `Authentication for ${piece.displayName || piece.name}: ${piece.auth.description}`,
        metadata: {
          pieceId: piece.id,
          pieceName: piece.name,
          segmentType: 'auth'
        }
      });
    }

    // Create general info segment with null checks
    const categories = piece.categories || [];
    const categoriesText = categories.length > 0 
      ? `It belongs to the following categories: ${categories.join(', ')}.` 
      : '';
    
    segments.push({
      id: uuidv4(),
      content: `${piece.displayName || piece.name} (${piece.name}) is a ${(piece.pieceType || 'unknown').toLowerCase()} piece with ${piece.actions || 0} actions and ${piece.triggers || 0} triggers. ${categoriesText} Version: ${piece.version || 'unknown'}`,
      metadata: {
        pieceId: piece.id,
        pieceName: piece.name,
        segmentType: 'general'
      }
    });
  }

  console.debug(`Created ${segments.length} segments from ${pieces.length} pieces`);
  return segments;
} 