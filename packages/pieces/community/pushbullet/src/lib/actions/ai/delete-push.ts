import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiDeletePush = createAction({
  auth: bushbulletAuth,
  name: 'ai_delete_push',
  displayName: 'Delete Push',
  description: 'Permanently deletes a push.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: pushbulletOutputSchemas.deletePush,
  aiMetadata: {
    description:
      'Permanently deletes a Pushbullet push from history on every device. This cannot be undone; to only clear the notification use Dismiss Push. Needs the push iden from List Pushes. Deleting a push that is already gone returns an error, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    iden: Property.ShortText({
      displayName: 'Push ID',
      description: 'The iden of the push, from List Pushes or a send action.',
      required: true,
    }),
  },
  async run(context) {
    const iden = context.propsValue.iden.trim();
    await pushbulletApi.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/pushes/${encodeURIComponent(iden)}`,
    });
    return { success: true, iden };
  },
});
