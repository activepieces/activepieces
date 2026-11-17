import { mailchimpOutputSchemas } from '../common/output-schemas';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpApi } from '../common/client';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const removeSubscriberFromTag = createAction({
  auth: mailchimpAuth,
  name: 'remove_subscriber_from_tag',
  classification: 'WRITE',
  displayName: 'Remove Subscriber from Tag',
  description: 'Remove a subscriber from a specific tag in your Mailchimp audience.',
  audience: 'both',
  aiMetadata: { description: 'Deactivates a tag on a subscriber, identified by email within a given audience (list). Use to un-segment or un-label a contact. Idempotent: removing a tag the member does not have leaves the state unchanged.', idempotent: true },
  outputSchema: mailchimpOutputSchemas['tagChange'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to remove from the tag',
      required: true,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to remove the subscriber from',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email, tag_name } = context.propsValue;
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const result = await client.request<unknown>({
      method: HttpMethod.POST,
      path: `${mailchimpApi.memberPath({ listId: list_id, email })}/tags`,
      body: { tags: [{ name: tag_name, status: 'inactive' }] },
      operation: 'remove subscriber from tag',
    });
    return {
      success: true,
      message: `Successfully removed subscriber ${email} from tag ${tag_name}`,
      data: result ?? null,
      _links: [],
    };
  },
});
