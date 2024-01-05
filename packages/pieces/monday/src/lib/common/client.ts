import mondaySdk from 'monday-sdk-js';
import { MondayClientSdk } from 'monday-sdk-js/types/client-sdk.interface';
import { MondayColumn } from './models';
import { mondayGraphQLMutations } from './mutations';
import { mondayGraphQLQueries } from './queries';
import { Board } from './types';
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
}
