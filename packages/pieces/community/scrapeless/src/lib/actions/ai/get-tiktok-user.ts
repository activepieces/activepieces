import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getTiktokUserAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_tiktok_user',
  displayName: 'Get TikTok User',
  description: 'Gets a TikTok user’s profile.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets a TikTok user's profile by username: bio, follower and like counts, and the sec_uid that List TikTok User Videos needs. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description:
        'TikTok username (unique id) without the @, e.g. "teamtrump".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.tiktok.user.detail',
      input: {
        unique_id: propsValue.username,
      },
    });
  },
});
