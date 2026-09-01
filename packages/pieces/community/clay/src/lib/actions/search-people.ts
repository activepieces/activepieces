import { createAction, Property } from '@activepieces/pieces-framework';
import { clayAuth } from '../auth';
import { runClayFiltersModeSearch } from '../common';

export const searchPeopleAction = createAction({
    auth: clayAuth,
    name: 'search_people',
    classification: 'SEARCH',
    displayName: 'Search People',
    description: 'Searches Clay\'s people database using structured filters.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search Clay\'s proprietary GTM database for people matching a JSON filter object. Use Search Companies instead when looking up companies rather than individuals. Safe to retry; results may change between calls.',
        idempotent: true,
    },
    props: {
        filters: Property.Json({
            displayName: 'Filters',
            description:
                'JSON filter object for the search. Discover available field names, types, and example filter payloads by calling the "Custom API Call" action with GET /search/filters-mode/fields?source_type=people using this piece\'s connection, then copy a payload from the response\'s "guidance.create_examples".',
            required: true,
        }),
        limit: Property.Number({
            displayName: 'Max results',
            required: false,
            defaultValue: 20,
            display: 'stepper',
            min: 1,
            max: 500,
        }),
    },
    async run(context) {
        return await runClayFiltersModeSearch({
            apiKey: context.auth.secret_text,
            sourceType: 'people',
            filters: context.propsValue.filters as Record<string, unknown>,
            limit: context.propsValue.limit ?? 20,
        });
    },
});
