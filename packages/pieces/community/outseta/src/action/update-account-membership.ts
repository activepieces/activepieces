import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updateAccountMembershipAction = createAction({
  name: 'update_account_membership',
  auth: outsetaAuth,
  displayName: 'Update Account Membership',
  description:
    "Update a person's membership on an account — typically used to designate them as the primary contact.",
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account.',
      required: true,
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      description: 'The UID of the person whose membership to update.',
      required: true,
    }),
    isPrimary: Property.Checkbox({
      displayName: 'Is Primary Contact',
      required: true,
      defaultValue: true,
      description:
        'Whether this person should be the primary contact for the account.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,PersonAccount.*,PersonAccount.Person.Uid`
    );
    const memberships: any[] =
      account.PersonAccount?.items ??
      account.PersonAccount?.Items ??
      (Array.isArray(account.PersonAccount) ? account.PersonAccount : []);

    const membership = memberships.find(
      (pa: any) => pa.Person?.Uid === context.propsValue.personUid
    );
    if (!membership) {
      throw new Error(
        `Person ${context.propsValue.personUid} is not a member of account ${context.propsValue.accountUid}.`
      );
    }

    const result = await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}/memberships/${membership.Uid}`,
      {
        Account: { Uid: context.propsValue.accountUid },
        Person: { Uid: context.propsValue.personUid },
        IsPrimary: context.propsValue.isPrimary,
      }
    );

    return {
      account_uid: context.propsValue.accountUid,
      membership_uid: membership.Uid,
      person_uid: context.propsValue.personUid,
      is_primary: result?.IsPrimary ?? context.propsValue.isPrimary,
    };
  },
});
