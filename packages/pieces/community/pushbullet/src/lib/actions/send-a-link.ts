import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../common/auth';
import { PushbulletPush, pushbulletApi } from '../common/client';
import { pushbulletProps } from '../common/props';
import { pushbulletOutputSchemas } from '../common/output-schemas';

export const sendALink = createAction({
  auth: bushbulletAuth,
  name: 'sendALink',
  classification: 'WRITE',
  displayName: 'Send a Link',
  description: 'Sends a clickable link notification to your devices, one device or an email address.',
  audience: 'human',
  outputSchema: pushbulletOutputSchemas.push,
  props: {
    url: Property.ShortText({
      displayName: 'URL to send',
      description: 'The link that opens when the notification is clicked, e.g. https://example.com.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The headline of the notification.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Optional text shown under the title.',
      required: false,
    }),
    device: pushbulletProps.device,
    email: pushbulletProps.email,
  },
  async run(context) {
    const { url, title, body, device, email } = context.propsValue;
    const target = pushbulletApi.buildTarget({ deviceIden: device ?? undefined, email: email ?? undefined });
    return await pushbulletApi.request<PushbulletPush>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/pushes',
      body: { type: 'link', url, title, body, ...target },
    });
  },
});
