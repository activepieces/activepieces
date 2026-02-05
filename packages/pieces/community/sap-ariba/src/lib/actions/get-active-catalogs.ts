import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const getActiveCatalogs = createAction({
    auth: sapAribaAuth,
    name: 'get_active_catalogs',
    displayName: 'Get Active Catalogs',
    description: 'Get list of active catalog data & supplier values from the specified date.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Realm name.',
            required: true,
        }),
        date: Property.DateTime({
            displayName: 'Activated From Date',
            description: 'Get catalogs activated from this date (ISO format).',
            required: true,
        }),
        supplierdomain: Property.ShortText({
            displayName: 'Supplier Domain',
            description: 'Filter by Supplier Domain ID (e.g., buyersystemid:Supplier16).',
            required: false,
        }),
        subscriptionName: Property.ShortText({
            displayName: 'Subscription Name',
            description: 'Filter by Subscription Name.',
            required: false,
        }),
        showAll: Property.Checkbox({
            displayName: 'Show All',
            description: 'Show all records.',
            required: false,
            defaultValue: false,
        }),
        showAdditionalFields: Property.Checkbox({
            displayName: 'Show Additional Fields',
            description: 'Include additional fields in response.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { realm, date, supplierdomain, subscriptionName, showAll, showAdditionalFields } = context.propsValue;

        const queryParams: Record<string, string> = {
            date,
        };

        if (supplierdomain) {
            queryParams['supplierdomain'] = supplierdomain;
        }
        if (subscriptionName) {
            queryParams['subscriptionName'] = subscriptionName;
        }
        if (showAll !== undefined) {
            queryParams['showAll'] = showAll.toString();
        }
        if (showAdditionalFields !== undefined) {
            queryParams['showAdditionalFields'] = showAdditionalFields.toString();
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/catalogs',
            queryParams,
            undefined,
            { realm }
        );

        return response;
    },
});
