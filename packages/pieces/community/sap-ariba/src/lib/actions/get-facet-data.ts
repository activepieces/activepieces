import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const getFacetData = createAction({
    auth: sapAribaAuth,
    name: 'get_facet_data',
    displayName: 'Get Facet Data',
    description: 'Get list of Facet data against realm.',
    audience: 'both',
    aiMetadata: { description: 'Retrieve catalog facet data (e.g. distinct classification codes) for a SAP Ariba realm. Use to enumerate facet values for filtering or grouping catalog content; requires realm, the facet field to select, and an RSQL filter expression. Read-only and idempotent.', idempotent: true },
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Realm name.',
            required: true,
        }),
        select: Property.ShortText({
            displayName: 'Select Field',
            description: 'Facet field to select (e.g., ClassificationCode).',
            required: true,
            defaultValue: 'ClassificationCode',
        }),
        rsqlfilter: Property.ShortText({
            displayName: 'RSQL Filter',
            description: 'RSQL Filter expression (e.g., CatalogName==JCNTechnologies).',
            required: true,
        }),
    },
    async run(context) {
        const { realm, select, rsqlfilter } = context.propsValue;

        const queryParams: Record<string, string> = {
            select,
            rsqlfilter,
        };

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/facets',
            queryParams,
            undefined,
            { realm }
        );

        return response;
    },
});
