import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../common/auth';
import { PushbulletPush, pushbulletApi } from '../common/client';
import { pushbulletProps } from '../common/props';
import { pushbulletOutputSchemas } from '../common/output-schemas';

export const sendANote = createAction({
  auth: bushbulletAuth,
  name: 'sendANote',
  classification: 'WRITE',
  displayName: 'Send a Note',
  description: 'Sends a text notification to your devices, one device or an email address.',
  audience: 'human',
  outputSchema: pushbulletOutputSchemas.push,
  props: {
    title: Property.ShortText({
      displayName: 'Note Title',
      description: 'The headline of the notification.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Note Body',
      description: 'The text shown under the title.',
      required: true,
    }),
    device: pushbulletProps.device,
    email: pushbulletProps.email,
  },
  async run(context) {
    const { title, body, device, email } = context.propsValue;
    const target = pushbulletApi.buildTarget({ deviceIden: device ?? undefined, email: email ?? undefined });
    return await pushbulletApi.request<PushbulletPush>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/pushes',
      body: { type: 'note', title, body, ...target },
    });
  },
});
