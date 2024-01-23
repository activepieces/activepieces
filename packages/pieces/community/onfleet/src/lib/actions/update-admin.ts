import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const updateAdmin = createAction({
  auth: onfleetAuth,
  name: 'update_admin',
  displayName: 'Update Administrator',
  description: 'Update an existing administrator',
  props: {
    admin: common.admin,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    const options: any = {};

    if (context.propsValue.name) options.name = context.propsValue.name;

    return await onfleetApi.administrators.update(
      context.propsValue.admin as string,
      options
    );
  },
});
