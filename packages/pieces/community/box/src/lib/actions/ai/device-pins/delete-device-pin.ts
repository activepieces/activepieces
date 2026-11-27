import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteDevicePinAction = createAction({
  auth: boxAuth,
  name: 'box_delete_device_pin',
  displayName: 'Delete Device Pin',
  description: 'Removes a Box device pin.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a device pin, unpinning that device from its user. Needs admin rights. Get the ID from List Device Pins.',
    idempotent: false,
  },
  props: {
    devicePinId: boxAiProps.devicePinId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/device_pinners/${encodeURIComponent(propsValue.devicePinId)}`,
    });
    return { deleted: true, devicePinId: propsValue.devicePinId };
  },
});
