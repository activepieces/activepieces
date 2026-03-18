import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const subscribeToEmailListAction = createAction({
  name: 'subscribe_to_email_list',
  auth: outsetaAuth,
  displayName: 'Subscribe to Email List',
  description: "Add a person's email address to a mailing list.",
  props: {
    emailListUid: Property.ShortText({
      displayName: 'Email List UID',
      required: true,
      description: 'The UID of the email list.',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    sendWelcomeEmail: Property.Checkbox({
      displayName: 'Send Welcome Email',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const person: Record<string, unknown> = {
      Email: context.propsValue.email,
    };
    if (context.propsValue.firstName) {
      person['FirstName'] = context.propsValue.firstName;
    }
    if (context.propsValue.lastName) {
      person['LastName'] = context.propsValue.lastName;
    }

    return await client.post<any>(
      `/api/v1/email/lists/${context.propsValue.emailListUid}/subscriptions`,
      {
        EmailList: { Uid: context.propsValue.emailListUid },
        Person: person,
        SendWelcomeEmail: context.propsValue.sendWelcomeEmail ?? false,
      }
    );
  },
});
