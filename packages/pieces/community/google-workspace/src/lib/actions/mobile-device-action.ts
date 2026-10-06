import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { GoogleWorkspaceApi } from '../common/client';
import { RESOURCES } from '../common/resources';
import { resolveAuth } from '../common/token';
import { mobileDeviceActionOutputSchema } from '../output-schemas';

export const MOBILE_DEVICE_ACTIONS: { label: string; value: string }[] = [
  { label: 'Approve', value: 'approve' },
  { label: 'Block', value: 'block' },
  { label: 'Wipe account (remove the Workspace account from the device)', value: 'admin_account_wipe' },
  { label: 'Wipe device (factory reset, irreversible)', value: 'admin_remote_wipe' },
  { label: 'Cancel remote wipe, then activate', value: 'cancel_remote_wipe_then_activate' },
  { label: 'Cancel remote wipe, then block', value: 'cancel_remote_wipe_then_block' },
];

export const mobileDeviceAction = createAction({
  name: 'mobileDeviceAction',
  classification: 'DESTRUCTIVE',
  displayName: 'Mobile Device Action',
  description: 'Approve, block or wipe a managed mobile device',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an administrative command to one managed mobile device: approve, block, wipe the Workspace account, factory-reset wipe, or cancel a pending wipe. Needs the device resourceId (from Search Records with type Mobile device). Wipes are irreversible once the device receives them, so do not retry blindly.',
    idempotent: false,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceId: Property.ShortText({
      displayName: 'Device Resource ID',
      description: 'The `resourceId` of the mobile device (from Search Records with type Mobile device).',
      required: true,
    }),
    action: Property.StaticDropdown<string, true>({
      displayName: 'Action',
      description: 'Wipes cannot be undone once the device receives them.',
      required: true,
      options: { options: MOBILE_DEVICE_ACTIONS },
    }),
  },
  outputSchema: mobileDeviceActionOutputSchema,
  async run(context) {
    const { resourceId, action } = context.propsValue;
    const auth = await resolveAuth(context.auth);

    await GoogleWorkspaceApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `${RESOURCES.mobile_device.itemPath({ id: resourceId })}/action`,
      body: { action },
    });

    return { resourceId: String(resourceId).trim(), action, success: true };
  },
});
