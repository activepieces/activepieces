import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const removePersonFromAccountAction = createAction({
  name: 'remove_person_from_account',
  auth: outsetaAuth,
  displayName: 'Remove Person from Account',
  description:
    'Remove a person from an account by deleting their membership. Note: the primary contact cannot be removed.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account.',
    }),
    membershipUid: Property.ShortText({
      displayName: 'Membership UID',
      required: true,
      description: 'The PersonAccount membership UID to remove.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.delete<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}/memberships/${context.propsValue.membershipUid}`
    );

    return {
      account_uid: context.propsValue.accountUid,
      membership_uid: context.propsValue.membershipUid,
      removed: true,
    };
  },
});
