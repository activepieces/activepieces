import { api } from '@/lib/api';
import {
  ListMcpsRequestQuery,
  McpPieceStatus,
  McpPieceWithConnection,
  McpWithPieces,
  SeekPage,
} from '@activepieces/shared';

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
  async list(
    request: ListMcpsRequestQuery
  ): Promise<SeekPage<McpWithPieces>> {
    return await api
      .get<SeekPage<McpWithPieces>>('/v1/mcp-servers', {
        ...request,
      });
  },
  async get(id: string): Promise<McpWithPieces> {
    return await api.get<McpWithPieces>(`/v1/mcp-servers/${id}`);
  },
  async create(): Promise<McpWithPieces | null> {
    return await api.post<McpWithPieces | null>('/v1/mcp-servers', {});
  },
  async update({ id, token }: UpdateMCPParams) {
    return await api.post<McpWithPieces>(`/v1/mcp-servers/${id}`, {
      token,
    });
  },
  async rotateToken(id: string) {
    return await api.post<McpWithPieces>(`/v1/mcp-servers/${id}/rotate`);
  },
  async getPieces(id: string) {
    return await api.get<{ pieces: McpPieceWithConnection[] }>(
      `/v1/mcp-pieces/${id}`,
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
  async bulkDelete(ids: string[]): Promise<void> {
    console.warn('Bulk delete MCP API call not implemented. IDs:', ids);
    return Promise.resolve();
  },
};
