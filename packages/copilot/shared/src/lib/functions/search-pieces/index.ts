

// Command-specific updates
export enum PieceCommandUpdate {
    PIECES_FOUND = 'PIECES_FOUND'
  }


  export enum PieceCommand {
    SEARCH_PIECES = 'SEARCH_PIECES'
  }

export interface PiecesFoundData {
    relevantPieces: {
      pieceName: string;
      content: string;
      logoUrl?: string;
      relevanceScore: number;
    }[];
  }