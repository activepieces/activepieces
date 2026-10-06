import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphIdentity, oneDriveApi } from '../common/graph-api';
import { onedriveGetDriveOutputSchema } from '../output-schemas';

export const onedriveGetDrive = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_get_drive',
  displayName: 'Get Drive',
  description: 'Get the connected OneDrive drive, including its type and storage quota.',
  audience: 'ai',
  outputSchema: onedriveGetDriveOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Read the signed-in user\'s own OneDrive drive: its drive ID, whether it is a personal or business drive, and its storage quota. Use it to check free space or to learn the account type before calling actions that only work on personal OneDrive or only on OneDrive for Business. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const drive = await oneDriveApi.request<GraphDrive>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/me/drive',
    });
    return {
      id: drive.id,
      name: drive.name ?? null,
      driveType: drive.driveType ?? null,
      webUrl: drive.webUrl ?? null,
      createdDateTime: drive.createdDateTime ?? null,
      lastModifiedDateTime: drive.lastModifiedDateTime ?? null,
      ownerName: drive.owner?.user?.displayName ?? null,
      ownerEmail: drive.owner?.user?.email ?? null,
      quotaTotal: drive.quota?.total ?? null,
      quotaUsed: drive.quota?.used ?? null,
      quotaRemaining: drive.quota?.remaining ?? null,
      quotaDeleted: drive.quota?.deleted ?? null,
      quotaState: drive.quota?.state ?? null,
    };
  },
});

type GraphDrive = {
  id: string;
  name?: string;
  driveType?: string;
  webUrl?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  owner?: GraphIdentity;
  quota?: {
    total?: number;
    used?: number;
    remaining?: number;
    deleted?: number;
    state?: string;
  };
};
