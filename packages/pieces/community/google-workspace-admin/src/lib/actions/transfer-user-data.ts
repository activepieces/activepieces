import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DATA_TRANSFER_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const transferUserData = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'transfer_user_data',
  classification: 'WRITE',
  displayName: 'Transfer User Data',
  description: "Transfers ownership of a user's Drive files, Calendar events or other app data to another user.",
  audience: 'both',
  aiMetadata: {
    description:
      "Start a data transfer that moves ownership of one app's data (e.g. Drive files, Calendar events) from one user to another, typically before deleting a departing employee. The transfer runs asynchronously; each call starts a new transfer.",
    idempotent: false,
  },
  props: {
    fromUser: googleAdminProps.user({ displayName: 'From User', required: true }),
    toUser: googleAdminProps.user({ displayName: 'To User', required: true }),
    application: googleAdminProps.dataTransferApp({ required: true }),
    drivePrivacyLevels: Property.StaticMultiSelectDropdown({
      displayName: 'Drive Files to Transfer',
      description: 'Drive and Docs only. Leave empty for all files.',
      required: false,
      options: {
        options: [
          { label: 'Files shared with others', value: 'SHARED' },
          { label: 'Private files', value: 'PRIVATE' },
        ],
      },
    }),
    releaseCalendarResources: Property.Checkbox({
      displayName: 'Release Calendar Resources',
      description: 'Calendar only. Release rooms and resources booked by the user for future events.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const [oldOwnerUserId, newOwnerUserId] = await Promise.all([
      googleAdminClient.getUserId({ auth, userKey: propsValue.fromUser }),
      googleAdminClient.getUserId({ auth, userKey: propsValue.toUser }),
    ]);
    const applicationTransferParams = [
      ...(propsValue.drivePrivacyLevels?.length
        ? [{ key: 'PRIVACY_LEVEL', value: propsValue.drivePrivacyLevels }]
        : []),
      ...(propsValue.releaseCalendarResources ? [{ key: 'RELEASE_RESOURCES', value: ['TRUE'] }] : []),
    ];
    const transfer = await googleAdminClient.request<{
      id: string;
      oldOwnerUserId: string;
      newOwnerUserId: string;
      overallTransferStatusCode?: string;
      requestTime?: string;
    }>({
      auth,
      method: HttpMethod.POST,
      url: `${DATA_TRANSFER_URL}/transfers`,
      body: {
        oldOwnerUserId,
        newOwnerUserId,
        applicationDataTransfers: [
          {
            applicationId: propsValue.application,
            ...(applicationTransferParams.length ? { applicationTransferParams } : {}),
          },
        ],
      },
    });
    return {
      transfer_id: transfer.id,
      old_owner_user_id: transfer.oldOwnerUserId,
      new_owner_user_id: transfer.newOwnerUserId,
      status: transfer.overallTransferStatusCode ?? null,
      request_time: transfer.requestTime ?? null,
    };
  },
});
