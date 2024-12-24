import { Piece, PieceSegment } from './types';
import { v4 as uuidv4 } from 'uuid';

export function processPieces(pieces: Piece[]): PieceSegment[] {
  console.debug('Processing pieces into segments...');
  const segments: PieceSegment[] = [];

  for (const piece of pieces) {
    const displayName = piece.displayName || piece.name;
    const categories = piece.categories || [];
    const categoriesText = categories.length > 0 
      ? `It belongs to the following categories: ${categories.join(', ')}.` 
      : '';
    

    if (piece?.description) {
      segments.push({
        id: uuidv4(),
        content: `${displayName} is ${piece.description}. This ${piece.pieceType?.toLowerCase() || 'automation'} piece ${
          piece.triggers > 0 ? `can trigger workflows with ${piece.triggers} different events` : ''
        }${piece.triggers > 0 && piece.actions > 0 ? ' and ' : ''}${
          piece.actions > 0 ? `can perform ${piece.actions} different actions` : ''
        }. ${categoriesText}`,
        metadata: {
          pieceId: piece.id,
          pieceName: piece.name,
          segmentType: 'description'
        }
      });
    }


    if (piece?.triggers > 0) {
      segments.push({
        id: uuidv4(),
        content: `Use ${displayName} to start automations when specific events occur. It provides ${piece.triggers} different triggers for starting workflows, such as when new data is created or updated.`,
        metadata: {
          pieceId: piece.id,
          pieceName: piece.name,
          segmentType: 'trigger'
        }
      });
    }

    if (piece?.actions > 0) {
      segments.push({
        id: uuidv4(),
        content: `Use ${displayName} to perform ${piece.actions} different actions in your automations. These actions can be used to create, update, or interact with ${displayName} in response to triggers.`,
        metadata: {
          pieceId: piece.id,
          pieceName: piece.name,
          segmentType: 'action'
        }
      });
    }

    if (piece?.auth?.description) {
      segments.push({
        id: uuidv4(),
        content: `To use ${displayName} in your automations: ${piece.auth.description}`,
        metadata: {
          pieceId: piece.id,
          pieceName: piece.name,
          segmentType: 'auth'
        }
      });
    }
  }

  console.debug(`Created ${segments.length} segments from ${pieces.length} pieces`);
  return segments;
} 