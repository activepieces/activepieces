import { createAction, Property } from '@activepieces/pieces-framework';
import { serpapiCommon } from '../common';
import { serpapiAuth } from '../../index';

export const youtubeSearch = createAction({
    auth: serpapiAuth,
    name: 'youtube_search',
    displayName: 'YouTube Search',
    description: 'Retrieve top video content results from YouTube for specific keywords or topics',
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
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Sort order for the results',
            required: false,
            options: {
                options: [
                    { label: 'Relevance', value: 'relevance' },
                    { label: 'Upload Date', value: 'date' },
                    { label: 'View Count', value: 'view_count' },
                    { label: 'Rating', value: 'rating' },
                ],
            },
        }),
        time: Property.StaticDropdown({
            displayName: 'Time Period',
            description: 'Time period for videos',
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
        const { query, country, language, num, start, sortBy, time } = propsValue;

        return await serpapiCommon.makeRequest(auth, {
            q: query,
            engine: 'youtube',
            gl: country,
            hl: language,
            num: num,
            start: start,
            sort_by: sortBy,
            time: time,
        });
    },
});
