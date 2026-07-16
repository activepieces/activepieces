import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { cursorProp, limitProp } from '../common/props';

export const listNaceCodes = createAction({
    name: 'list_nace_codes',
    auth: firmaradarAuth,
    displayName: 'Look Up NACE Codes',
    description:
        'Search or browse the Norwegian NACE industry-code catalogue — resolve ' +
        'the exact code before subscribing to industry events or listing ' +
        'companies. Free-text search, hierarchy walk, or EU→NO conversion.',
    props: {
        q: Property.ShortText({
            displayName: 'Search Text',
            description: 'Free-text search on the Norwegian label.',
            required: false,
        }),
        parent: Property.ShortText({
            displayName: 'Parent Code',
            description: 'Return the direct children of this code (hierarchy walk).',
            required: false,
        }),
        eu: Property.ShortText({
            displayName: 'EU NACE Code',
            description: 'EU NACE Rev. 2 code — returns the Norwegian level-5 subgroups.',
            required: false,
        }),
        limit: limitProp(50, 200),
        cursor: cursorProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/nace/catalog',
            query: {
                q: context.propsValue.q,
                parent: context.propsValue.parent,
                eu: context.propsValue.eu,
                limit: context.propsValue.limit,
                cursor: context.propsValue.cursor,
            },
        });
    },
});
