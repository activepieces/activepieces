


export interface SearchPiecesRequest {
  command: WebsocketCopilotCommand.SEARCH_PIECES;
  data: {
    query: string;
  };
}

export interface SearchPiecesResponse {
  type: 'SEARCH_PIECES_RESPONSE';
  data: {
    pieces: PieceSearchResult[];
  };
}

export interface PieceSearchResult {
  pieceName: string;
  content: string;
  logoUrl: string;
  relevanceScore: number;
}



export enum WebsocketCopilotCommand {
    SEARCH_PIECES = 'SEARCH_PIECES',
  }

  
  