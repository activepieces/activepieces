import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { PushbulletPush, pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiDismissPush = createAction({
  auth: bushbulletAuth,
  name: 'ai_dismiss_push',
  displayName: 'Dismiss Push',
  description: 'Marks a push as dismissed.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: pushbulletOutputSchemas.push,
  aiMetadata: {
    description:
      'Marks a Pushbullet push as dismissed, which clears its notification on all devices but keeps it in history (use Delete Push to remove it). Needs the push iden from List Pushes. Dismissing an already dismissed push succeeds and changes nothing, so repeat calls are safe. Returns the updated push.',
    idempotent: true,
  },
  props: {
    iden: Property.ShortText({
      displayName: 'Push ID',
      description: 'The iden of the push, from List Pushes or a send action.',
      required: true,
    }),
  },
  async run(context) {
    return await pushbulletApi.request<PushbulletPush>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/pushes/${encodeURIComponent(context.propsValue.iden.trim())}`,
      body: { dismissed: true },
    });
  },
});
