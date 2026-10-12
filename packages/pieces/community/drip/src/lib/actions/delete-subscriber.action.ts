import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const deleteSubscriberAction = createAction({
  auth: dripAuth,
  name: 'delete_subscriber',
  displayName: 'Delete Subscriber',
  description: 'Permanently deletes a subscriber and their history. This cannot be undone.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a subscriber and all their history from Drip, by email or subscriber ID; this cannot be undone. Use only when the user asks to erase a contact; to stop emails use Unsubscribe From All Emails instead. A repeat call finds them gone and reports alreadyDeleted=true, so it is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
  },
  outputSchema: dripOutputSchemas.deleteSubscriber,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const subscriber = dripApi.requireText({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const segment = dripApi.seg({ value: subscriber, label: 'Subscriber Email or ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    try {
      await dripApi.request<unknown>({
        token,
        method: HttpMethod.DELETE,
        path: `${dripApi.accountPath(accountId)}/subscribers/${segment}`,
        operation: 'delete subscriber',
      });
      return { subscriber, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (dripApi.isNotFound(error)) {
        return { subscriber, deleted: false, alreadyDeleted: true };
      }
      throw error;
    }
  },
});
