import {
  MCPWithPieces,
  MCPPieceStatus,
  MCPPieceWithConnection,
} from '@activepieces/shared';

import { api } from '@/lib/api';

interface UpdateMCPParams {
  id: string;
  token?: string;
}

interface AddPieceParams {
  mcpId: string;
  pieceName: string;
  connectionId?: string;
  status: MCPPieceStatus;
}

interface UpdatePieceParams {
  pieceId: string;
  connectionId?: string;
  status?: MCPPieceStatus;
}

export const mcpApi = {
  async get() {
    return await api.get<MCPWithPieces>(`/v1/mcp-servers`);
  },
  async update({ id, token }: UpdateMCPParams) {
    return await api.post<MCPWithPieces>(`/v1/mcp-servers/${id}`, {
      token,
    });
  },
  async rotateToken(id: string) {
    return await api.post<MCPWithPieces>(`/v1/mcp-servers/${id}/rotate`);
  },
  async getPieces() {
    return await api.get<{ pieces: MCPPieceWithConnection[] }>(
      `/v1/mcp-pieces`,
    );
  },
  async addPiece({
    mcpId,
    pieceName,
    connectionId,
    status,
  }: AddPieceParams): Promise<MCPWithPieces> {
    return await api.post(`/v1/mcp-pieces`, {
      mcpId,
      pieceName,
      connectionId,
      status,
    });
  },
  async updatePiece({
    pieceId,
    connectionId,
    status,
  }: UpdatePieceParams): Promise<MCPWithPieces> {
    return await api.post(`/v1/mcp-pieces/${pieceId}`, {
      connectionId,
      status,
    });
  },
  async deletePiece(pieceId: string): Promise<MCPWithPieces> {
    return await api.delete(`/v1/mcp-pieces/${pieceId}`);
  },
};
