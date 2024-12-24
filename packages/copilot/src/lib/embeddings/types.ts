export interface PieceAuth {
  required: boolean;
  description: string;
  props: Record<string, any>;
  type: string;
  displayName: string;
}

export interface Piece {
  id: string;
  created: string;
  updated: string;
  name: string;
  authors: string[];
  displayName: string;
  logoUrl: string;
  projectUsage: number;
  description: string;
  version: string;
  minimumSupportedRelease: string;
  maximumSupportedRelease: string;
  auth: PieceAuth;
  actions: number;
  triggers: number;
  pieceType: string;
  categories: string[];
  packageType: string;
}

export interface PieceSegment {
  id: string;
  content: string;
  metadata: {
    pieceId: string;
    pieceName: string;
    segmentType: 'description' | 'auth' | 'general';
  };
}

export interface EmbeddedPiece extends PieceSegment {
  embedding: number[];
} 