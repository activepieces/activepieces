import { createAction } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { toMemberInput } from '../common/customer-match';
import {
  acceptTermsProp,
  consentAdPersonalizationProp,
  consentAdUserDataProp,
  membersProp,
  uploadCustomerMatch,
  userListProp,
  waitForCompletionProp,
} from '../common/customer-match-action';
import { customerIdProp } from '../common/props';
import { customerMatchOutputSchema } from '../output-schemas';

export const addCustomerMatchData = createAction({
  name: 'addCustomerMatchData',
  classification: 'WRITE',
  displayName: 'Add Customer Match Data',
  description: 'Upload hashed e-mails, phones or addresses to a Customer Match audience list (Data Manager API)',
  audience: 'both',
  aiMetadata: {
    description:
      'Add people to a CRM-based Customer Match audience list by e-mail, phone or full address; values are normalized and SHA-256 hashed before upload. Use to grow an audience for targeting; to take people out use Remove customer match data. Requires consent values and confirmation that the Customer Match terms were accepted. Processing is asynchronous; re-adding the same members does not duplicate them.',
    idempotent: true,
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    userList: userListProp,
    members: membersProp,
    adUserData: consentAdUserDataProp,
    adPersonalization: consentAdPersonalizationProp,
    acceptTerms: acceptTermsProp,
    waitForCompletion: waitForCompletionProp,
  },
  outputSchema: customerMatchOutputSchema,
  async run(context) {
    const { customerId, userList, members, adUserData, adPersonalization, acceptTerms, waitForCompletion } = context.propsValue;
    if (!acceptTerms) {
      throw new Error(
        'Customer Match uploads require the advertiser to accept Google\'s Customer Match terms of service. Tick "Customer Match Terms Accepted".'
      );
    }
    return uploadCustomerMatch({
      auth: context.auth,
      customerId,
      userList,
      members: (members ?? []).map(toMemberInput),
      mode: 'add',
      consent: { adUserData, adPersonalization },
      waitForCompletion: Boolean(waitForCompletion),
    });
  },
});
