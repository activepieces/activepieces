import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const sendConfirmationEmailAction = createAction({
  name: 'send_confirmation_email',
  auth: outsetaAuth,
  displayName: 'Send Confirmation Email',
  description:
    'Send a confirmation email to the primary contact of an account, a specific person, or all members.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account.',
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: false,
      description:
        'Leave empty for primary contact, or use * for all members.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    let url = `/api/v1/crm/accounts/${context.propsValue.accountUid}/send-confirmation-email`;
    if (context.propsValue.personUid) {
      url += `?personUid=${encodeURIComponent(context.propsValue.personUid)}`;
    }

    await client.put<any>(url, {});

    return {
      account_uid: context.propsValue.accountUid,
      person_uid: context.propsValue.personUid ?? null,
      sent: true,
    };
  },
});
