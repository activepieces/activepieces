import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { accountUidDropdown, personUidDropdown } from '../common/dropdowns';

export const addPersonToAccountAction = createAction({
  name: 'add_person_to_account',
  auth: outsetaAuth,
  displayName: 'Add Person to Account',
  description: 'Add an existing person to an existing account.',
  props: {
    accountUid: accountUidDropdown(),
    personUid: personUidDropdown(),
    isPrimary: Property.Checkbox({
      displayName: 'Is Primary Contact',
      required: false,
      defaultValue: false,
      description: 'Whether this person should be the primary contact for the account.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`
    );

    const existingMemberships = account.PersonAccount ?? [];

    const alreadyLinked = existingMemberships.some(
      (pa: any) => pa.Person?.Uid === context.propsValue.personUid
    );
    if (alreadyLinked) {
      throw new Error(
        `Person ${context.propsValue.personUid} is already a member of account ${context.propsValue.accountUid}.`
      );
    }

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

    return {
      account_uid: result.Uid ?? null,
      account_name: result.Name ?? null,
      person_count: Array.isArray(result.PersonAccount) ? result.PersonAccount.length : null,
    };
  },
});
