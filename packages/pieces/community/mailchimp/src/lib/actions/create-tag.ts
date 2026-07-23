import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const createTag = createAction({
  auth: mailchimpAuth,
  name: 'create_tag',
  displayName: 'Create Tag',
  description: 'Create a new tag in a Mailchimp audience',
  audience: 'both',
  aiMetadata: { description: 'Creates a new tag on an audience (list) so it can later be applied to subscribers. Use to set up a tag ahead of tagging contacts. Not idempotent: calling again with the same name creates a duplicate tag.', idempotent: false },
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to create',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, name } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      // Tags are static segments with no members yet.
      // Docs: https://mailchimp.com/developer/marketing/api/list-segments/add-segment/
      const segment = await client.lists.createSegment(list_id as string, {
        name,
        static_segment: [],
      });

      return {
        success: true,
        message: `Successfully created tag "${name}"`,
        tag: segment,
      };
    } catch (error: any) {
      throw new Error(`Failed to create tag: ${error.message || JSON.stringify(error)}`);
    }
  },
});
