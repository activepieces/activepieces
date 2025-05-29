import { createAction, Property } from '@activepieces/pieces-framework';
import { serpapiCommon } from '../common';

import { serpapiAuth } from '../../index';

export const googleNewsSearch = createAction({
    auth: serpapiAuth,
    name: 'google_news_search',
    displayName: 'Google News Search',
    description: 'Track recent news articles for a keyword or brand to monitor media mentions',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: 'The search query to look up',
            required: true,
        }),
        country: Property.ShortText({
            displayName: 'Country',
            description: 'Country to use for the search (e.g., us, uk, ca)',
            required: false,
        }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'Language to use for the search (e.g., en, es, fr)',
            required: false,
        }),
        num: Property.Number({
            displayName: 'Number of Results',
            description: 'Number of results to return (default: 10)',
            required: false,
        }),
        start: Property.Number({
            displayName: 'Start Position',
            description: 'Starting position for the search results (for pagination)',
            required: false,
        }),
        time: Property.StaticDropdown({
            displayName: 'Time Period',
            description: 'Time period for news articles',
            required: false,
            options: {
                options: [
                    { label: 'Past Hour', value: 'h' },
                    { label: 'Past Day', value: 'd' },
                    { label: 'Past Week', value: 'w' },
                    { label: 'Past Month', value: 'm' },
                    { label: 'Past Year', value: 'y' },
                ],
            },
        }),
    },
    async run({ propsValue, auth }) {
        const { query, country, language, num, start, time } = propsValue;

        return await serpapiCommon.makeRequest(auth, {
            q: query,
            engine: 'google_news',
            gl: country,
            hl: language,
            num: num,
            start: start,
            tbm: 'nws',
            tbs: time ? `qdr:${time}` : undefined,
        });
    },
});
