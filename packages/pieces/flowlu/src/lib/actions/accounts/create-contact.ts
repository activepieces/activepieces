import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { flowluAuth } from '../../..';
import { flowluCommon, makeClient } from '../../common';
import { flowluProps } from '../../common/props';
export const createContactAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_contact',
  displayName: 'Create CRM Account(Contact)',
  description: 'Creates a new contact in CRM.',
  props: {
    honorific_title_id: flowluCommon.honorific_title_id(false),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
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
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof flowluAuth>
    );
    return await client.createAccount({ id: 2, ...context.propsValue });
  },
});
