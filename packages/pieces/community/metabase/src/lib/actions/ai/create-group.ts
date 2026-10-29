import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateGroupOutputSchema } from '../../output-schemas';

export const createGroupAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_group',
  outputSchema: metabaseCreateGroupOutputSchema,
  displayName: 'Create Group',
  description: 'Create a permission group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a permission group. Fails if a group with the same name exists. Needs an admin key.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createGroup({
      auth,
      body: { name: propsValue.name },
    });
  },
});
