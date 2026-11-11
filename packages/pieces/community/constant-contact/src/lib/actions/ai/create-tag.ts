import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { tagOutputSchema } from '../../common/output-schemas';

export const createTagAiAction = createAction({
  auth: constantContactAuth,
  name: 'create_tag_ai',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Creates a new contact tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Constant Contact tag and returns its tag_id. Tag names must be unique: a repeat with the same name fails with HTTP 409, so check List Tags first.',
    idempotent: false,
  },
  outputSchema: tagOutputSchema,
  props: {
    name: aiProps.text({ displayName: 'Name', description: 'Unique tag name, up to 255 characters.', required: true }),
  },
  async run({ auth, propsValue }) {
    const name = ccInput.textWithin({ value: propsValue.name, label: 'Name', max: 255 });
    if (name === undefined) {
      throw new Error('Name is required.');
    }
    const response = await ccClient.request({ accessToken: auth.access_token, method: 'POST', path: '/contact_tags', operation: 'create tag', body: { name } });
    return response.body;
  },
});
