import { isNil } from '@activepieces/pieces-framework';
import mondaySdk from 'monday-sdk-js';
import { MondayClientSdk } from 'monday-sdk-js/types/client-sdk.interface';
import { Board, MondayColumn, User } from './models';
import { mondayGraphQLMutations } from './mutations';
import { mondayGraphQLQueries } from './queries';
export class mondayClient {
  private client: MondayClientSdk;
  constructor(apiKey: string) {
    this.client = mondaySdk();
    this.client.setToken(apiKey);
    this.client.setApiVersion('2023-10');
  }
  async listWorkspcaes() {
    return await this.client.api<{
      workspaces: { id: string; name: string }[];
    }>(mondayGraphQLQueries.listWorkspaces);
  }
  async listWorkspaceBoards(variables: object) {
    return await this.client.api<{
      boards: { id: string; name: string; type: string }[];
    }>(mondayGraphQLQueries.listWorkspaceBoards, { variables: variables });
  }
  async listBoardGroups(variables: object) {
    return await this.client.api<{ boards: Board[] }>(
      mondayGraphQLQueries.listBoardGroups,
      { variables: variables }
    );
  }
  async listBoardColumns(variables: object) {
    return await this.client.api<{ boards: { columns: MondayColumn[] }[] }>(
      mondayGraphQLQueries.listBoardColumns,
      { variables: variables }
    );
  }
  async listBoardItems(variables: object) {
    return await this.client.api<{ boards: Board[] }>(
      mondayGraphQLQueries.listBoardItems,
      { variables: variables }
    );
  }
  async createItem(variables: object) {
    return await this.client.api(mondayGraphQLMutations.createItem, {
      variables: variables,
    });
  }
  async updateItem(variables: object) {
    return await this.client.api(mondayGraphQLMutations.updateItem, {
      variables: variables,
    });
  }
  async createWebhook(variables: object) {
    return await this.client.api<{ id: string; board_id: string }>(
      mondayGraphQLMutations.createWebhook,
      {
        variables: variables,
      }
    );
  }
  async deleteWebhook(variables: object) {
    return await this.client.api(mondayGraphQLMutations.deleteWebhook, {
      variables: variables,
    });
  }
  async listUsers() {
    return await this.client.api<{ users: User[] }>(
      mondayGraphQLQueries.listUsers
    );
  }
  async getBoardItemValues(variables: object) {
    return await this.client.api<{ boards: Board[] }>(
      mondayGraphQLQueries.getBoardItemValues,
      { variables: variables }
    );
  }
  async getItemColumnValues(variables: object) {
    return await this.client.api<{ boards: Board[] }>(
      mondayGraphQLQueries.getItemColumnValues,
      {
        variables: variables,
      }
    );
  }
  async createColumn(variables: object) {
    return await this.client.api<{ id: string }>(
      mondayGraphQLMutations.createColumn,
      { variables: variables }
    );
  }
  async createGroup(variables: object) {
    return await this.client.api<{ id: string }>(
      mondayGraphQLMutations.createGroup,
      { variables: variables }
    );
  }
  async createUpdate(variables: object) {
    return await this.client.api<{ id: string }>(
      mondayGraphQLMutations.createUpdate,
      { variables: variables }
    );
  }
  async query<T>({
    query,
    variables,
  }: {
    query: string;
    variables?: Record<string, unknown>;
  }): Promise<T> {
    const response = await this.client.api<T>(query, {
      variables: variables ?? {},
      apiVersion: MONDAY_AI_API_VERSION,
    });
    const errorMessage = extractErrorMessage(response);
    if (!isNil(errorMessage)) {
      throw new Error(`monday.com API error: ${errorMessage}`);
    }
    if (isNil(response.data)) {
      throw new Error('monday.com API returned no data.');
    }
    return response.data;
  }
}

function extractErrorMessage(response: unknown): string | null {
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  if ('errors' in response && Array.isArray(response.errors) && response.errors.length > 0) {
    return response.errors
      .map((error: unknown) =>
        typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : JSON.stringify(error)
      )
      .join('; ');
  }
  if ('error_message' in response && !isNil(response.error_message)) {
    return String(response.error_message);
  }
  return null;
}

export const MONDAY_AI_API_VERSION = '2026-07';
