import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { emailListUidDropdown } from '../common/dropdowns';

export const manageEmailListSubscriptionAction = createAction({
  name: 'manage_email_list_subscription',
  auth: outsetaAuth,
  displayName: 'Manage Email List Subscription',
  description: 'Subscribe a person to an email list, or unsubscribe them from it.',
  props: {
    action: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Subscribe', value: 'subscribe' },
          { label: 'Unsubscribe', value: 'unsubscribe' },
        ],
      },
    }),
    emailListUid: emailListUidDropdown(),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'The email address to subscribe or unsubscribe.',
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      description: 'Only used when subscribing.',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      description: 'Only used when subscribing.',
    }),
    sendWelcomeEmail: Property.Checkbox({
      displayName: 'Send Welcome Email',
      required: false,
      defaultValue: false,
      description:
        'Only used when subscribing. If checked, Outseta will send the list welcome email.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    if (context.propsValue.action === 'subscribe') {
      const person: Record<string, unknown> = {
        Email: context.propsValue.email,
      };
      if (context.propsValue.firstName) person['FirstName'] = context.propsValue.firstName;
      if (context.propsValue.lastName) person['LastName'] = context.propsValue.lastName;

      const result = await client.post<any>(
        `/api/v1/email/lists/${context.propsValue.emailListUid}/subscriptions`,
        {
          EmailList: { Uid: context.propsValue.emailListUid },
          Person: person,
          SendWelcomeEmail: context.propsValue.sendWelcomeEmail ?? false,
        }
      );
      return {
        action: 'subscribed',
        uid: result.Uid ?? null,
        email_list_uid: result.EmailList?.Uid ?? null,
        person_email: result.Person?.Email ?? null,
        person_uid: result.Person?.Uid ?? null,
        created: result.Created ?? null,
      };
    }

    const subscriptions = await client.getAllPages<any>(
      `/api/v1/email/lists/${context.propsValue.emailListUid}/subscriptions?$filter=Person/Email eq '${OutsetaClient.escapeOData(context.propsValue.email)}'&fields=*,Person.*`
    );
    const subscription = subscriptions.find(
      (s: any) => s.Person?.Email?.toLowerCase() === context.propsValue.email.toLowerCase()
    );
    if (!subscription) {
      throw new Error(
        `No subscription found for email "${context.propsValue.email}" in this list.`
      );
    }
    await client.delete<any>(
      `/api/v1/email/lists/${context.propsValue.emailListUid}/subscriptions/${subscription.Uid}`
    );
    return {
      action: 'unsubscribed',
      email_list_uid: context.propsValue.emailListUid,
      subscription_uid: subscription.Uid,
      email: context.propsValue.email,
    };
  },
});
