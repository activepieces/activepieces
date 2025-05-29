import { createAction, Property } from '@activepieces/pieces-framework';
import { serpapiCommon } from '../common';
import { serpapiAuth } from '../../index';

export const googleTrendsSearch = createAction({
    auth: serpapiAuth,
    name: 'google_trends_search',
    displayName: 'Google Trends Search',
    description: 'Discover trending keywords over time to inform content strategy or market research',
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
        date: Property.StaticDropdown({
            displayName: 'Date Range',
            description: 'Time period for the trends data',
            required: false,
            options: {
                options: [
                    { label: 'Past Hour', value: 'now 1-H' },
                    { label: 'Past 4 Hours', value: 'now 4-H' },
                    { label: 'Past Day', value: 'now 1-d' },
                    { label: 'Past 7 Days', value: 'now 7-d' },
                    { label: 'Past 30 Days', value: 'today 1-m' },
                    { label: 'Past 90 Days', value: 'today 3-m' },
                    { label: 'Past 12 Months', value: 'today 12-m' },
                    { label: 'Past 5 Years', value: 'today 5-y' },
                    { label: '2004 to Present', value: 'all' },
                ],
            },
        }),
        category: Property.Number({
            displayName: 'Category',
            description: 'Category ID for the search (e.g., 0 for all categories)',
            required: false,
        }),
        geo: Property.ShortText({
            displayName: 'Geographic Location',
            description: 'Geographic location for the trends (e.g., US, US-CA)',
            required: false,
        }),
    },
    async run({ propsValue, auth }) {
        const { query, country, language, date, category, geo } = propsValue;

        return await serpapiCommon.makeRequest(auth, {
            q: query,
            engine: 'google_trends',
            gl: country,
            hl: language,
            date: date,
            cat: category,
            geo: geo,
        });
    },
});
