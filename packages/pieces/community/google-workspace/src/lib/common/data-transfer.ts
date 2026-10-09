import { HttpMethod } from '@activepieces/pieces-common';

import { DATA_TRANSFER_PATH, DIRECTORY_PATH, GoogleWorkspaceApi, MY_CUSTOMER } from './client';
import type { ResolvedAuth } from './client';

export async function userProfileId({ auth, userKey }: { auth: ResolvedAuth; userKey: string }): Promise<string> {
  const key = String(userKey ?? '').trim();
  if (!key) {
    throw new Error('A user e-mail or id is required.');
  }
  if (/^\d+$/.test(key)) {
    return key;
  }
  const user = await GoogleWorkspaceApi.request<{ id?: string }>({
    auth,
    method: HttpMethod.GET,
    path: `${DIRECTORY_PATH}/users/${encodeURIComponent(key)}`,
    query: { projection: 'basic' },
  });
  if (!user.id) {
    throw new Error(`Google returned no id for user "${key}".`);
  }
  return user.id;
}

export const DataTransferApi = {
  async listApplications(auth: ResolvedAuth): Promise<TransferApplication[]> {
    const { items } = await GoogleWorkspaceApi.listAll<TransferApplication>({
      auth,
      path: `${DATA_TRANSFER_PATH}/applications`,
      itemsKey: 'applications',
      query: { customerId: MY_CUSTOMER, maxResults: 100 },
      maxRows: 500,
    });
    return items;
  },

  async createTransfer({ auth, transfer }: { auth: ResolvedAuth; transfer: DataTransfer }): Promise<DataTransfer> {
    return GoogleWorkspaceApi.request<DataTransfer>({
      auth,
      method: HttpMethod.POST,
      path: `${DATA_TRANSFER_PATH}/transfers`,
      body: transfer,
    });
  },

  async getTransfer({
    auth,
    transferId,
    timeoutMs,
  }: {
    auth: ResolvedAuth;
    transferId: string;
    timeoutMs?: number;
  }): Promise<DataTransfer> {
    return GoogleWorkspaceApi.request<DataTransfer>({
      auth,
      method: HttpMethod.GET,
      path: `${DATA_TRANSFER_PATH}/transfers/${encodeURIComponent(transferId)}`,
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    });
  },
};

export type TransferApplication = {
  id: string;
  name: string;
  transferParams?: TransferParam[];
};

export type TransferParam = { key: string; value: string[] };

export type ApplicationDataTransfer = {
  applicationId: string;
  applicationTransferParams?: TransferParam[];
  applicationTransferStatus?: string;
};

export type DataTransfer = {
  id?: string;
  oldOwnerUserId: string;
  newOwnerUserId: string;
  overallTransferStatusCode?: string;
  requestTime?: string;
  applicationDataTransfers?: ApplicationDataTransfer[];
};
