import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphRecord } from '../../common/common';
import { createPagePostOutputSchema } from '../../output-schemas';

export const createPagePostAction = createAction({
  auth: facebookPagesAuth,
  name: 'create_page_post',
  classification: 'WRITE',
  displayName: 'Create Page Post',
  description: 'Publishes or schedules a text or link post on a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publish a text or link post to the feed of a Facebook Page, now or at a scheduled time at least 10 minutes ahead. Returns the post ID in PageID_PostID format for Get Post, Update Post and Delete Post. Use Create Page Photo Post, Create Page Video Post or Create Multi-Photo Post for media. Not idempotent: each call creates a new post.',
    idempotent: false,
  },
  outputSchema: createPagePostOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The text of the post. Required unless a link is given.',
      required: false,
    }),
    link: Property.ShortText({
      displayName: 'Link',
      description: 'A URL to attach; Facebook renders it as a preview card.',
      required: false,
    }),
    scheduledPublishTime: Property.DateTime({
      displayName: 'Scheduled Publish Time',
      description: 'ISO 8601 date and time to publish the post, at least 10 minutes from now. Leave empty to publish immediately.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { message, link, scheduledPublishTime } = propsValue;
    if (!facebookPagesCommon.isProvided(message) && !facebookPagesCommon.isProvided(link)) {
      throw new Error('Provide a message, a link, or both.');
    }
    const schedule = facebookPagesCommon.isProvided(scheduledPublishTime)
      ? { published: false, scheduled_publish_time: facebookPagesCommon.toScheduledUnixTime({ value: scheduledPublishTime }) }
      : {};
    return facebookPagesCommon.pageRequest<GraphRecord>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.POST,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/feed`,
      body: { message, link, ...schedule },
    });
  },
});
