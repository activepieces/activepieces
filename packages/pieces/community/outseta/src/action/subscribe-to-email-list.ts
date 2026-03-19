import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { emailListUidDropdown } from '../common/dropdowns';

export const subscribeToEmailListAction = createAction({
  name: 'subscribe_to_email_list',
  auth: outsetaAuth,
  displayName: 'Subscribe to Email List',
  description: "Add a person's email address to a mailing list.",
  props: {
    emailListUid: emailListUidDropdown(),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'The email address to subscribe.',
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
      description: 'If checked, Outseta will send the list welcome email to this subscriber.',
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

    const result = await client.post<any>(
      `/api/v1/email/lists/${context.propsValue.emailListUid}/subscriptions`,
      {
        EmailList: { Uid: context.propsValue.emailListUid },
        Person: person,
        SendWelcomeEmail: context.propsValue.sendWelcomeEmail ?? false,
      }
    );

    return {
      uid: result.Uid ?? null,
      email_list_uid: result.EmailList?.Uid ?? null,
      person_email: result.Person?.Email ?? null,
      person_uid: result.Person?.Uid ?? null,
      created: result.Created ?? null,
    };
  },
});
