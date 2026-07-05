import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';

export const updateContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_contact',
  displayName: 'Update CRM Account(Contact)',
  description: 'Updates an existing contact in CRM.',
  audience: 'both',
  aiMetadata: { description: 'Updates fields on an existing CRM account (contact) in Flowlu, identified by its account id. Use to change details such as name, contact info, or category on a known contact. The id is required and must reference an existing contact.', idempotent: false },
  props: {
    id: flowluCommon.contact_id(true),
    honorific_title_id: flowluCommon.honorific_title_id(false),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
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
    const id = context.propsValue.id!;
    const client = makeClient(
      context.auth
    );
    return await client.updateContact(id, { type: 2, ...context.propsValue });
  },
});
