import { createAction } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { toMemberInput } from '../common/customer-match';
import {
  membersProp,
  uploadCustomerMatch,
  userListProp,
  waitForCompletionProp,
} from '../common/customer-match-action';
import { customerIdProp } from '../common/props';
import { customerMatchOutputSchema } from '../output-schemas';

export const removeCustomerMatchData = createAction({
  name: 'removeCustomerMatchData',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Customer Match Data',
  description: 'Remove members (by hashed e-mail, phone or address) from a Customer Match audience list (Data Manager API)',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove people from a CRM-based Customer Match audience list, matched by hashed e-mail, phone or full address. Use for opt-outs or deletion requests; to add people use Add customer match data. Processing is asynchronous; removing members that are not in the list is harmless, so retries are safe.',
    idempotent: true,
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    userList: userListProp,
    members: membersProp,
    waitForCompletion: waitForCompletionProp,
  },
  outputSchema: customerMatchOutputSchema,
  async run(context) {
    const { customerId, userList, members, waitForCompletion } = context.propsValue;
    return uploadCustomerMatch({
      auth: context.auth,
      customerId,
      userList,
      members: (members ?? []).map(toMemberInput),
      mode: 'remove',
      waitForCompletion: Boolean(waitForCompletion),
    });
  },
});
