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
}
