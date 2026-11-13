import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { listOutputSchema } from '../output-schemas';

export const createListAction = createAction({
  auth: emailOctopusAuth,
  name: 'create_list',
  outputSchema: listOutputSchema,
  classification: 'WRITE',
  displayName: 'Create List',
  description: 'Creates a new mailing list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new EmailOctopus mailing list with the given name. Use to set up a fresh list before adding contacts. Requires only a list name. Not idempotent — each call creates a separate list even if the name matches an existing one.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name for the new list.',
      required: true,
    }),
  },
  async run(context) {
    return await emailOctopusApi.createList({
      auth: context.auth,
      name: context.propsValue.name,
    });
  },
});
