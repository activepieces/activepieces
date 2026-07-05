import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const updateAdmin = createAction({
  auth: onfleetAuth,
  name: 'update_admin',
  displayName: 'Update Administrator',
  description: 'Update an existing administrator',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Onfleet organization administrator by admin ID, currently only their full name. Not idempotent: it patches the live admin record. Requires a known admin ID; use create-admin to add a new administrator or delete-admin to remove one.', idempotent: false },
  props: {
    admin: common.admin,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    const options: any = {};

    if (context.propsValue.name) options.name = context.propsValue.name;

    return await onfleetApi.administrators.update(
      context.propsValue.admin as string,
      options
    );
  },
});
