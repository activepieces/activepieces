import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteMobileDevice = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_mobile_device',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Mobile Device',
  description: 'Removes a mobile device from management.',
  audience: 'both',
  aiMetadata: {
    description:
      "Remove a mobile device from Google endpoint management; it stops syncing work data. Does not wipe the device, use Take Action on Mobile Device for that. A retry after success fails because the device no longer exists.",
    idempotent: false,
  },
  props: {
    resourceId: googleAdminProps.mobileDevice({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/customer/my_customer/devices/mobile/${encodeURIComponent(propsValue.resourceId)}`,
    });
    return { success: true, resource_id: propsValue.resourceId };
  },
});
