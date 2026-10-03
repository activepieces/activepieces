import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const mobileDeviceAction = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'mobile_device_action',
  classification: 'DESTRUCTIVE',
  displayName: 'Take Action on Mobile Device',
  description: 'Approves, blocks or wipes a managed mobile device.',
  audience: 'both',
  aiMetadata: {
    description:
      "Run a management command on a mobile device: approve, block, wipe the work account, wipe the whole device, or cancel a pending wipe. Wipes cannot be undone once executed on the device. Repeating the same command is safe.",
    idempotent: true,
  },
  props: {
    resourceId: googleAdminProps.mobileDevice({ required: true }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      options: {
        options: [
          { label: 'Approve', value: 'approve' },
          { label: 'Block', value: 'block' },
          { label: 'Wipe work account only', value: 'admin_account_wipe' },
          { label: 'Wipe entire device (factory reset)', value: 'admin_remote_wipe' },
          { label: 'Cancel wipe and re-activate', value: 'cancel_remote_wipe_then_activate' },
          { label: 'Cancel wipe and block', value: 'cancel_remote_wipe_then_block' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/customer/my_customer/devices/mobile/${encodeURIComponent(propsValue.resourceId)}/action`,
      body: { action: propsValue.action },
    });
    return { success: true, resource_id: propsValue.resourceId, action: propsValue.action };
  },
});
