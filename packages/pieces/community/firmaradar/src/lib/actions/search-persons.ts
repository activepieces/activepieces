import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { limitProp } from '../common/props';

export const searchPersons = createAction({
    name: 'search_persons',
    auth: firmaradarAuth,
    displayName: 'Search Persons',
    description:
        'Typo-tolerant name search across shareholders and role holders — find ' +
        'the person keys used by the person-profile actions. Requires ' +
        'full-ownership access (person data is sensitive).',
    props: {
        q: Property.ShortText({
            displayName: 'Name',
            description: 'Person name (minimum 2 characters, fuzzy matching).',
            required: true,
        }),
        limit: limitProp(30, 100),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/person/search',
            query: {
                q: context.propsValue.q,
                limit: context.propsValue.limit,
            },
        });
    },
});
