import { PieceSearchResult } from '@activepieces/copilot-shared';

export interface Function {
  id: string;
  name: string;
  description: string;
  category: string;
  type: FunctionType;
  parameters?: FunctionParameter[];
}

export enum FunctionType {
  PIECE_SEARCH = 'PIECE_SEARCH',
  // Add more function types as needed
}

export interface FunctionParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

export interface FunctionTestResult {
  success: boolean;
  data?: PieceSearchResult[];
  error?: string;
} 