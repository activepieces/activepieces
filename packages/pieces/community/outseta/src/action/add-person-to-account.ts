import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addPersonToAccountAction = createAction({
  name: 'add_person_to_account',
  auth: outsetaAuth,
  displayName: 'Add person to account',
  description: 'Add an existing person to an existing account',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: true,
    }),
    isPrimary: Property.Checkbox({
      displayName: 'Is Primary Contact',
      required: false,
      defaultValue: false,
      description: 'Whether this person should be the primary contact',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const result = await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
      {
        PersonAccount: [
          {
            Person: { Uid: context.propsValue.personUid },
            IsPrimary: context.propsValue.isPrimary ?? false,
          },
        ],
      }
    );

    return result;
  },
});
