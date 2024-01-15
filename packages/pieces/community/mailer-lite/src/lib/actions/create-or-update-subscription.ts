import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailerListAuth } from '../..';

export const createOrUpdateSubscriber = createAction({
  auth: mailerListAuth,
  name: 'add_or_update_subscriber',
  displayName: 'Add or Update subscriber',
  description: 'Create or update a existing subscription',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the new contact',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new contact',
      required: false,
    }),
  },
  async run(context) {
    const api_key = context.auth;
    const mailerLite = new MailerLite({ api_key });

    const params: MailerLiteParams = {
      email: context.propsValue.email,
    };

    if (context.propsValue.name)
      params.fields = { name: context.propsValue.name };

    const response = await mailerLite.subscribers.createOrUpdate(params);
    return response.data.data;
  },
});

type MailerLiteParams = {
  email: string;
  fields?: {
    name: string;
  };
};
