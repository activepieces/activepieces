import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const createContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_contact',
  displayName: 'Create CRM Account(Contact)',
  description: 'Creates a new contact in CRM.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new person-type CRM account (a contact) in Flowlu, requiring at least a first name. Use to add an individual to the CRM; for companies use Create CRM Account (Organization) instead. Not idempotent — each call creates a new contact record.', idempotent: false },
  props: {
    honorific_title_id: flowluCommon.honorific_title_id(false),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    ...flowluProps.account,
  },
  async run(context) {
    const {auth, ...propsValue} = context;
    const client = makeClient(
      context.auth
    );
    return await client.createAccount({ type: 2, ...propsValue });
  },
});
