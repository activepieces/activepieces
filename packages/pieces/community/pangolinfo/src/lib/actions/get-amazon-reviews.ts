import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pangolinfoAuth } from '../auth';
import { pangolinfoClient } from '../common';
import { pangolinfoProps } from '../props';

const getAmazonReviews = createAction({
  name: 'get_amazon_reviews',
  displayName: 'Get Amazon Reviews',
  description:
    'Retrieve Amazon ratings and reviews by ASIN for voice-of-customer analysis.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves recent or helpful Amazon reviews for an ASIN. Use for voice-of-customer analysis, sentiment research, issue discovery, and product insights. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pangolinfoAuth,
  props: {
    asin: Property.ShortText({
      displayName: 'ASIN',
      description: 'Amazon product ASIN.',
      required: true,
    }),
    site: pangolinfoProps.amazonSite,
    pageCount: Property.Number({
      displayName: 'Pages',
      description: 'Number of review pages, from 1 to 3.',
      required: false,
      defaultValue: 1,
    }),
    starFilter: Property.StaticDropdown({
      displayName: 'Star Filter',
      required: false,
      defaultValue: 'all_stars',
      options: {
        options: [
          { label: 'All Stars', value: 'all_stars' },
          { label: 'Five Star', value: 'five_star' },
          { label: 'Four Star', value: 'four_star' },
          { label: 'Three Star', value: 'three_star' },
          { label: 'Two Star', value: 'two_star' },
          { label: 'One Star', value: 'one_star' },
        ],
      },
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort Reviews',
      required: false,
      defaultValue: 'recent',
      options: {
        options: [
          { label: 'Most Recent', value: 'recent' },
          { label: 'Most Helpful', value: 'helpful' },
        ],
      },
    }),
  },
  async run(context) {
    const { asin, site, pageCount, starFilter, sortBy } = context.propsValue;
    const pages = Math.max(1, Math.min(3, pageCount ?? 1));
    return pangolinfoClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v1/scrape',
      body: {
        url: 'https://www.amazon.com',
        site,
        parserName: 'amzReviewV2',
        format: 'json',
        bizContext: {
          bizKey: 'review',
          asin,
          pageCount: pages,
          filterByStar: starFilter ?? 'all_stars',
          sortBy: sortBy ?? 'recent',
        },
      },
    });
  },
});

export { getAmazonReviews };
