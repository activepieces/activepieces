import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const listTiktokUserVideosAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_list_tiktok_user_videos',
  displayName: 'List TikTok User Videos',
  description: 'Lists the videos a TikTok user has posted.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists one page of a TikTok user's videos with captions, stats and the cursor for the next page. Needs the user's sec_uid from Get TikTok User. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    secUid: Property.ShortText({
      displayName: 'User sec_uid',
      description: 'The user’s sec_uid, from Get TikTok User.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Paging cursor from the previous page. Defaults to "0" (first page).',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of videos to return. Defaults to 35.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.tiktok.user.work',
      input: {
        sec_uid: propsValue.secUid,
        cursor: propsValue.cursor,
        count: propsValue.count,
      },
    });
  },
});
