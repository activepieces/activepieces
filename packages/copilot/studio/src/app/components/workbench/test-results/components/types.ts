export interface PiecesFoundData {
  relevantPieces: Array<{
    pieceName: string;
    content: string;
    logoUrl?: string;
  }>;
  timestamp: string;
}
export interface TestErrorData {
  error: string;
  timestamp: string;
}
