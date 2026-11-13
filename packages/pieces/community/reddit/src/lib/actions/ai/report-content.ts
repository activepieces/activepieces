import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditReportContentOutputSchema } from '../../output-schemas';

export const redditReportContent = createAction({
  auth: redditAuth,
  name: 'reddit_report_content',
  outputSchema: redditReportContentOutputSchema,
  displayName: 'Report Post, Comment or Message',
  description: 'Reports a post, comment or message to the subreddit moderators.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Files a report on a post (t3_), comment (t1_) or private message (t4_) for the subreddit\'s moderators, with a reason (often one of the subreddit\'s rule names from Get Subreddit Rules). Only report when a human asked to. Not idempotent: each call files a report. Needs the `report` scope: older connections must reconnect.',
    idempotent: false,
  },
  props: {
    thing_id: Property.ShortText({ displayName: 'Fullname', description: 'Fullname of the item to report, e.g. "t3_abc123".', required: true }),
    reason: Property.ShortText({ displayName: 'Reason', description: 'Report reason, max 100 characters (e.g. a subreddit rule name).', required: true }),
  },
  async run({ auth, propsValue }) {
    const thingId = redditApi.requireFullname({ value: propsValue.thing_id, label: 'Fullname' });
    if (propsValue.reason.length > 100) {
      throw new Error('Reason must be at most 100 characters.');
    }
    await redditApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/api/report',
      form: { api_type: 'json', thing_id: thingId, reason: propsValue.reason },
    });
    return { success: true, id: thingId, reason: propsValue.reason };
  },
});
