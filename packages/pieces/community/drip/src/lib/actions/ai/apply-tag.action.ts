import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../../auth';
import { dripApi } from '../../common/client';
import { dripProps } from '../../common/props';
import { dripOutputSchemas } from '../../output-schemas';

export const applyTagAction = createAction({
  auth: dripAuth,
  name: 'apply_tag',
  displayName: 'Apply Tag (by Account ID)',
  description: 'Applies a tag to a subscriber by email, without picking the account from a list.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Applies a tag to a Drip subscriber identified by email address. If no subscriber has that email, Drip creates one (active) with the tag. Workflows or rules that start on this tag may run. Applying a tag the subscriber already has changes nothing, so it is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    email: dripProps.email(),
    tag: Property.ShortText({ displayName: 'Tag', description: 'The tag to apply, e.g. Customer.', required: true }),
  },
  outputSchema: dripOutputSchemas.applyTag,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const email = dripApi.requireText({ value: propsValue.email, label: 'Email' });
    const tag = dripApi.requireText({ value: propsValue.tag, label: 'Tag' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/tags`,
      operation: 'apply tag',
      body: { tags: [{ email, tag }] },
    });
    return { email, tag, applied: true };
  },
});
