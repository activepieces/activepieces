import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const manageAccountMembershipAction = createAction({
  name: 'manage_account_membership',
  auth: outsetaAuth,
  displayName: 'Manage Account Membership',
  description: 'Add or remove a person from an account.',
  props: {
    action: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Add Person to Account', value: 'add' },
          { label: 'Remove Person from Account', value: 'remove' },
        ],
      },
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account.',
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: true,
      description: 'The UID of the person to add or remove.',
    }),
    isPrimary: Property.Checkbox({
      displayName: 'Is Primary Contact',
      required: false,
      defaultValue: false,
      description:
        'Only used when adding: whether this person should be the primary contact for the account.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=*,PersonAccount.*,PersonAccount.Person.*`
    );
    const existingMemberships: any[] =
      account.PersonAccount?.items ??
      account.PersonAccount?.Items ??
      (Array.isArray(account.PersonAccount) ? account.PersonAccount : []);

    if (context.propsValue.action === 'add') {
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
          Uid: pa.Uid,
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
        action: 'added',
        account_uid: result.Uid ?? null,
        account_name: result.Name ?? null,
        person_count: Array.isArray(result.PersonAccount) ? result.PersonAccount.length : null,
      };
    }

    const membership = existingMemberships.find(
      (pa: any) => pa.Person?.Uid === context.propsValue.personUid
    );
    if (!membership) {
      throw new Error(
        `Person ${context.propsValue.personUid} is not a member of account ${context.propsValue.accountUid}.`
      );
    }
    await client.delete<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}/memberships/${membership.Uid}`
    );
    return {
      action: 'removed',
      account_uid: context.propsValue.accountUid,
      membership_uid: membership.Uid,
      person_uid: context.propsValue.personUid,
    };
  },
});
