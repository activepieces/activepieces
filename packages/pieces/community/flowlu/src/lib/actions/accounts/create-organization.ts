import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../..';
import { makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const createOrganizationAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_organization',
  displayName: 'Create CRM Account(Organization)',
  description: 'Creates a new organization in CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      required: true,
    }),
    name_legal_full: Property.ShortText({
      displayName: 'Full legal name for Organization',
      required: false,
    }),
    ...flowluProps.account,
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.createAccount({ type: 1, ...context.propsValue });
  },
});
