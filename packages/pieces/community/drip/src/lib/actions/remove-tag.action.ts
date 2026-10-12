import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const removeTagAction = createAction({
  auth: dripAuth,
  name: 'remove_tag',
  displayName: 'Remove Tag From Subscriber',
  description: 'Removes a tag from a subscriber.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a tag from a Drip subscriber identified by email or subscriber ID and reports whether the tag had been applied; fails if there is no such subscriber. Removing a tag the subscriber does not have changes nothing, so it is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
    tag: Property.ShortText({ displayName: 'Tag', description: 'The tag to remove.', required: true }),
  },
  outputSchema: dripOutputSchemas.removeTag,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const segment = dripApi.seg({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const tag = dripApi.requireText({ value: propsValue.tag, label: 'Tag' });
    const tagSegment = dripApi.seg({ value: tag, label: 'Tag' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/subscribers/${segment}`,
      operation: 'find subscriber',
    });
    const subscriber = dripApi.firstRecord({ body, key: 'subscribers', operation: 'find subscriber' });
    const tags = Array.isArray(subscriber['tags']) ? subscriber['tags'].map((item) => String(item).toLowerCase()) : [];
    await dripApi.request<unknown>({
      token,
      method: HttpMethod.DELETE,
      path: `${dripApi.accountPath(accountId)}/subscribers/${segment}/tags/${tagSegment}`,
      operation: 'remove tag',
    });
    return {
      subscriberId: subscriber['id'] ?? null,
      email: subscriber['email'] ?? null,
      tag,
      wasApplied: tags.includes(tag.toLowerCase()),
      removed: true,
    };
  },
});
