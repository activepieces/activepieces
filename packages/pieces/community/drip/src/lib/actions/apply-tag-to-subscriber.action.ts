import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dripCommon } from '../common';
import { dripApi } from '../common/client';
import { dripAuth } from '../auth';
import { dripOutputSchemas } from '../output-schemas';

export const dripApplyTagToSubscriber = createAction({
  auth: dripAuth,
  name: 'apply_tag_to_subscriber',
  classification: 'WRITE',
  description: 'Apply a tag to a subscriber',
  audience: 'human',
  aiMetadata: {
    description:
      'Applies a tag to a subscriber in a Drip account, identifying the subscriber by email address; if no subscriber has that email, Drip creates one with the tag. Repeating with the same email and tag has no additional effect, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Apply a tag to subscriber',
  props: {
    account_id: dripCommon.account_id,
    subscriber: dripCommon.subscriber,
    tag: Property.ShortText({
      displayName: 'Tag',
      required: true,
      description: 'Tag to apply',
    }),
  },
  outputSchema: dripOutputSchemas.legacyEmptyResponse,
  async run({ auth, propsValue }) {
    return await dripApi.send<Record<string, never>>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(propsValue.account_id)}/tags`,
      operation: 'apply tag',
      body: {
        tags: [
          {
            email: propsValue.subscriber,
            tag: propsValue.tag,
          },
        ],
      },
    });
  },
});
