import { PlannerPromptTemplate } from "../copilot-shared";


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
    RUN_TESTS = 'RUN_TESTS',
    TEST_AGENT = 'TEST_AGENT',
}

export const formatPlannerPromptTemplate = (template: PlannerPromptTemplate): string => {
  const sections = [
    template.system,
    template.context,
    template.request,
    ...template.defaultGuidelines,
    ...template.requirements,
    ...template.important
  ];

  return sections.filter(Boolean).join('\n\n');
};

  
  