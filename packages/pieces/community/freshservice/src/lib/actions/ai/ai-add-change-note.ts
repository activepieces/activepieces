import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall } from '../../common/client';
import { freshserviceCommon } from '../../common/props';
import { freshserviceSchemas } from '../../common/schemas';

export const aiAddChangeNote = createAction({
  auth: freshserviceAuth,
  name: 'ai_add_change_note',
  displayName: 'Add Change Note (AI)',
  description: 'Adds a note to a Freshservice change request.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.note,
  aiMetadata: {
    description:
      'Adds a note to a Freshservice change request by numeric change id (from List Changes). Notes are private (agents only) unless private is "no". Not idempotent — each call adds another note.',
    idempotent: false,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
    body: Property.LongText({ displayName: 'Note', description: 'HTML is allowed.', required: true }),
    private: freshserviceCommon.yesNo({
      displayName: 'Private',
      description: 'yes (default) keeps the note visible to agents only.',
      required: false,
    }),
  },
  async run(context) {
    const { change_id, body, private: isPrivate } = context.propsValue;
    const response = await freshserviceApiCall<{ note: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `changes/${change_id}/notes`,
      auth: context.auth,
      body: { body, private: isPrivate !== 'no' },
    });
    return response.body.note;
  },
});
