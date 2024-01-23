import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { dripCommon } from '../common';
import { dripAuth } from '../../';

export const dripApplyTagToSubscriber = createAction({
  auth: dripAuth,
  name: 'apply_tag_to_subscriber',
  description: 'Apply a tag to a subscriber',
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
  async run({ auth, propsValue }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${dripCommon.baseUrl(propsValue.account_id)}/tags`,
      body: {
        tags: [
          {
            email: propsValue.subscriber,
            tag: propsValue.tag,
          },
        ],
      },
      headers: {
        Authorization: dripCommon.authorizationHeader(auth),
      },
      queryParams: {},
    };
    return await httpClient.sendRequest<Record<string, never>>(request);
  },
});
