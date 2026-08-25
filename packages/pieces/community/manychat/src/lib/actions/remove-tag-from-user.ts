import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL, subscriberId, tagIdDropdown } from '../common/props';
import { manychatAuth } from '../auth';

export const removeTagFromUserAction = createAction({
  name: 'removeTagFromUser',
  displayName: 'Remove Tag from User',
  description: 'Remove a tag from a user.',
  audience: 'both',
  aiMetadata: { description: 'Removes a tag from a Manychat subscriber, identified by subscriber ID and tag ID, then returns the updated subscriber info. Use to unlabel or de-segment a known contact. Idempotent: removing a tag the subscriber no longer has leaves the same state.', idempotent: true },
  auth:manychatAuth,
  props: {
    subscriberId: subscriberId,
    tagId: tagIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { subscriberId, tagId } = propsValue;
    
        const removeTagResponse = await httpClient.sendRequest<{ status: string }>({
          url: `${BASE_URL}/subscriber/removeTag`,
          method: HttpMethod.POST,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.secret_text,
          },
          body: {
            subscriber_id: subscriberId,
            tag_id: tagId,
          },
        });
    
        if (removeTagResponse.body.status !== 'success') {
          throw Error(`Unexpected Error occured : ${JSON.stringify(removeTagResponse.body)}`);
        }
    
        const userResponse = await httpClient.sendRequest<{ data: Record<string, any> }>({
          method: HttpMethod.GET,
          url: `${BASE_URL}/subscriber/getInfo`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.secret_text,
          },
          queryParams: {
            subscriber_id: subscriberId.toString(),
          },
        });
    
        return userResponse.body.data;
  },
});
