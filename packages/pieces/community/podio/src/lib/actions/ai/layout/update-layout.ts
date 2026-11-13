import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioDeleteCustomLayoutOutputSchema } from '../../../output-schemas';

export const updateLayoutAction = createAction({
  auth: podioAuth,
  name: 'podio_update_layout',
  outputSchema: podioDeleteCustomLayoutOutputSchema,
  displayName: 'Update Layout',
  description: 'Sets the badge or relationship layout of an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets which values fill the slots of a Podio app\'s badge or relationship layout and returns the updated layout; the slots you send replace the layout, so start from Get Layout. Undo it with Delete Custom Layout. The app id comes from List Apps or Get App, field ids from the fields of Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
    layoutType: podioAiProps.choice({
      required: true,
      displayName: 'Layout Type',
      description: '"badge" for the item card layout, "relationship" for how items look when referenced from other apps.',
      values: ['badge', 'relationship'],
    }),
    fields: podioAiProps.json({
      required: true,
      displayName: 'Slots',
      description: 'The layout slots as a JSON object with keys header, content, details_1 to details_4; each is null or {"type": "field", "id": <field id>}, {"type": "fivestar", "id": <voting id>} or {"type": "virtual", "id": "created_on"} (also created_by, last_edit_by, comment_count, file_count, app_item_id, tags).',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/layout/${propsValue.appId}/${propsValue.layoutType}`,
      body: { fields: propsValue.fields },
    });
  },
});
