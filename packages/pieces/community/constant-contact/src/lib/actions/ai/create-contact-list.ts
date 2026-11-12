import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { listOutputSchema } from '../../common/output-schemas';

export const createContactListAiAction = createAction({
  auth: constantContactAuth,
  name: 'create_contact_list_ai',
  classification: 'WRITE',
  displayName: 'Create Contact List',
  description: 'Creates a new contact list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Constant Contact contact list and returns its list_id. Names must be unique: a repeat with the same name fails with HTTP 409, so check List Contact Lists first.',
    idempotent: false,
  },
  outputSchema: listOutputSchema,
  props: {
    name: aiProps.text({ displayName: 'Name', description: 'Unique list name, up to 255 characters.', required: true }),
    description: aiProps.text({ displayName: 'Description', description: 'Optional text describing the list.' }),
    favorite: aiProps.yesNo({ displayName: 'Favorite', description: 'yes to mark the list as a favorite. Defaults to no.' }),
  },
  async run({ auth, propsValue }) {
    const name = ccInput.textWithin({ value: propsValue.name, label: 'Name', max: 255 });
    if (name === undefined) {
      throw new Error('Name is required.');
    }
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'POST',
      path: '/contact_lists',
      operation: 'create contact list',
      body: {
        name,
        description: ccInput.optionalText(propsValue.description),
        favorite: aiInput.yesNo({ value: propsValue.favorite, label: 'Favorite' }) ?? false,
      },
    });
    return response.body;
  },
});
