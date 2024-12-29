import { Socket } from "socket.io";
import { WebsocketCopilotCommand, WebsocketCopilotUpdate } from "@activepieces/copilot-shared";
import { createCommandHandler } from "./command-handler";
import { findRelevantPieces } from "../../tools/embeddings";
import { addResult, handleError } from "../../util/websocket-utils";

const handleSearchPieces = async (socket: Socket, data: { query: string }): Promise<void> => {
  try {
    console.debug('[SearchPiecesHandler] Searching pieces with query:', data.query);
    
    const pieces = await findRelevantPieces(data.query);
    const results = pieces.map((p) => ({
      pieceName: p.metadata.pieceName,
      content: p.content,
      logoUrl: p.metadata.logoUrl || '',
      relevanceScore: p.similarity || 0,
    }));

    addResult(socket, {
      type: WebsocketCopilotUpdate.PIECES_FOUND,
      data: {
        timestamp: new Date().toISOString(),
        relevantPieces: results
      }
    });

    console.debug('[SearchPiecesHandler] Found', results.length, 'pieces');
  } catch (error) {
    handleError(socket, error, 'Searching pieces');
  }
};

export const searchPiecesHandler = createCommandHandler(
  WebsocketCopilotCommand.SEARCH_PIECES,
  handleSearchPieces
); 