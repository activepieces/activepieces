import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const unsubscribeSubscriberAction = createAction({
  auth: dripAuth,
  name: 'unsubscribe_subscriber',
  displayName: 'Unsubscribe From All Emails',
  description: 'Unsubscribes a subscriber from all Drip mailings.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Unsubscribes a contact (by email or subscriber ID) from all Drip mailings and returns the updated subscriber with status unsubscribed. Use only when the user asks to opt someone out; re-subscribing them later needs their consent. Repeating it leaves them unsubscribed, so it is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
  },
  outputSchema: dripOutputSchemas.subscriber,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const segment = dripApi.seg({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/subscribers/${segment}/unsubscribe_all`,
      operation: 'unsubscribe subscriber',
    });
    return dripApi.firstRecord({ body, key: 'subscribers', operation: 'unsubscribe subscriber' });
  },
});
