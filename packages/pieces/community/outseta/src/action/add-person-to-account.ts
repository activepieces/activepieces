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

    // Fetch the full account so PUT sends all fields back (Outseta uses full-replacement PUT)
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`
    );

    const existingMemberships = account.PersonAccount ?? [];

    // Check if person is already linked to this account
    const alreadyLinked = existingMemberships.some(
      (pa: any) => pa.Person?.Uid === context.propsValue.personUid
    );
    if (alreadyLinked) {
      throw new Error(
        `Person ${context.propsValue.personUid} is already a member of account ${context.propsValue.accountUid}.`
      );
    }

    // Add the new person to the PersonAccount array
    // Strip existing memberships to minimal shape to avoid sending metadata back
    const updatedMemberships = [
      ...existingMemberships.map((pa: any) => ({
        Person: { Uid: pa.Person?.Uid },
        IsPrimary: pa.IsPrimary ?? false,
      })),
      {
        Person: { Uid: context.propsValue.personUid },
        IsPrimary: context.propsValue.isPrimary ?? false,
      },
    ];

    const result = await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
      { ...account, PersonAccount: updatedMemberships }
    );

    return result;
  },
});
