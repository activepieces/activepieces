import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const findSubscriberAction = createAction({
  auth: dripAuth,
  name: 'find_subscriber',
  displayName: 'Find Subscriber',
  description: 'Finds one subscriber by email address or Drip subscriber ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up one Drip subscriber by email address or subscriber ID and returns their profile, status, tags and custom fields, or found=false when there is no such subscriber. Use before updating, tagging or deleting a contact. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
  },
  outputSchema: dripOutputSchemas.findSubscriber,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const subscriber = dripApi.seg({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    try {
      const body = await dripApi.request<unknown>({
        token,
        method: HttpMethod.GET,
        path: `${dripApi.accountPath(accountId)}/subscribers/${subscriber}`,
        operation: 'find subscriber',
      });
      return { found: true, subscriber: dripApi.firstRecord({ body, key: 'subscribers', operation: 'find subscriber' }) };
    } catch (error) {
      if (dripApi.isNotFound(error)) {
        return { found: false, subscriber: null };
      }
      throw error;
    }
  },
});
