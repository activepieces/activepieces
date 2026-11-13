import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

const MAX_BATCH = 1000;

export const batchUpsertSubscribersAction = createAction({
  auth: dripAuth,
  name: 'batch_upsert_subscribers',
  displayName: 'Create or Update Subscribers (Batch)',
  description: 'Creates or updates up to 1,000 subscribers in one request. Drip processes the batch in the background.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates or updates up to 1,000 Drip subscribers in one call; each item is a subscriber object with an email or id plus optional fields such as first_name, tags or custom_fields. Drip processes the batch in the background (changes appear after a delay) and allows only 50 batch calls per hour. Matched on email or id, so repeating the same batch is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscribers: Property.Json({
      displayName: 'Subscribers',
      description:
        'A JSON array of 1 to 1,000 subscriber objects. Each needs "email" or "id"; other keys use Drip names, e.g. [{"email": "jane@example.com", "first_name": "Jane", "tags": ["Customer"]}].',
      required: true,
      defaultValue: [{ email: 'jane@example.com', first_name: 'Jane', tags: ['Customer'] }],
    }),
  },
  outputSchema: dripOutputSchemas.batchUpsert,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const subscribers = dripApi.parseArray({ value: propsValue.subscribers, label: 'Subscribers' }) ?? [];
    if (subscribers.length < 1 || subscribers.length > MAX_BATCH) {
      throw new Error(`Subscribers must contain between 1 and ${MAX_BATCH} items (got ${subscribers.length}).`);
    }
    const invalid = subscribers.findIndex((item) => !dripApi.isRecord(item) || (dripApi.optionalText(item['email']) === undefined && dripApi.optionalText(item['id']) === undefined));
    if (invalid !== -1) {
      throw new Error(`Subscriber #${invalid + 1} must be an object with an "email" or "id".`);
    }
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/subscribers/batches`,
      operation: 'batch create or update subscribers',
      body: { batches: [{ subscribers }] },
    });
    return { submitted: subscribers.length, accepted: true };
  },
});
