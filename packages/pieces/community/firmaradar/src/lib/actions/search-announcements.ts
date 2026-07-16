import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { cursorProp, limitProp } from '../common/props';

export const searchAnnouncements = createAction({
    name: 'search_announcements',
    auth: firmaradarAuth,
    displayName: 'Search Announcements',
    description:
        'Cross-company search in BRREG legal-event announcements with type, date ' +
        'and free-text filters — find bankruptcies, mergers and dissolutions ' +
        'across the whole register.',
    props: {
        q: Property.ShortText({
            displayName: 'Search Text',
            description: 'Free-text search in company names.',
            required: false,
        }),
        type: Property.ShortText({
            displayName: 'Announcement Type',
            description: 'Substring match on the announcement type, e.g. konkurs.',
            required: false,
        }),
        from: Property.ShortText({
            displayName: 'From Date',
            description: 'ISO date (YYYY-MM-DD).',
            required: false,
        }),
        to: Property.ShortText({
            displayName: 'To Date',
            description: 'ISO date (YYYY-MM-DD).',
            required: false,
        }),
        orgnr: Property.ShortText({
            displayName: 'Organisation Number',
            description: 'Restrict to one nine-digit organisation number.',
            required: false,
        }),
        limit: limitProp(50, 200),
        cursor: cursorProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/announcements/search',
            query: {
                q: context.propsValue.q,
                type: context.propsValue.type,
                from: context.propsValue.from,
                to: context.propsValue.to,
                orgnr: context.propsValue.orgnr,
                limit: context.propsValue.limit,
                cursor: context.propsValue.cursor,
            },
        });
    },
});
