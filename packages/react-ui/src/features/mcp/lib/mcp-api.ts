import {
  McpPieceStatus,
  McpPieceWithConnection,
  McpWithPieces,
  SeekPage,
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
  status: McpPieceStatus;
}

interface UpdatePieceParams {
  pieceId: string;
  connectionId?: string;
  status?: McpPieceStatus;
}

export const mcpApi = {
  async get() {
    return await api.get<SeekPage<McpWithPieces>>(`/v1/mcp-servers`).then(res=>res.data[0]);
  },
  async update({ id, token }: UpdateMCPParams) {
    return await api.post<McpWithPieces>(`/v1/mcp-servers/${id}`, {
      token,
    });
  },
  async rotateToken(id: string) {
    return await api.post<McpWithPieces>(`/v1/mcp-servers/${id}/rotate`);
  },
  async getPieces() {
    return await api.get<{ pieces: McpPieceWithConnection[] }>(
      `/v1/mcp-pieces`,
    );
  },
  async addPiece({
    mcpId,
    pieceName,
    connectionId,
    status,
  }: AddPieceParams): Promise<McpWithPieces> {
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
  }: UpdatePieceParams): Promise<McpWithPieces> {
    return await api.post(`/v1/mcp-pieces/${pieceId}`, {
      connectionId,
      status,
    });
  },
  async deletePiece(pieceId: string): Promise<McpWithPieces> {
    return await api.delete(`/v1/mcp-pieces/${pieceId}`);
  },
};
