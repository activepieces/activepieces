import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const getPendingApprovables = createAction({
    auth: sapAribaAuth,
    name: 'get_pending_approvables',
    displayName: 'Get Pending Approvables',
    description: 'List all documents/tasks that are pending approval.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Unique identifier of the realm.',
            required: true,
        }),
        approvableType: Property.StaticDropdown({
            displayName: 'Approvable Type',
            description: 'Filter by document type.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Requisitions', value: 'requisitions' },
                    { label: 'Invoices', value: 'invoices' },
                    { label: 'Contracts', value: 'contracts' },
                    { label: 'Payment', value: 'payment' },
                ],
            },
        }),
        user: Property.ShortText({
            displayName: 'User',
            description: 'Filter by username.',
            required: false,
        }),
        passwordAdapter: Property.ShortText({
            displayName: 'Password Adapter',
            description: 'Filter by password adapter.',
            required: false,
        }),
        count: Property.Checkbox({
            displayName: 'Include Count',
            description: 'Include total count in response.',
            required: false,
            defaultValue: false,
        }),
        top: Property.Number({
            displayName: 'Page Size',
            description: 'Number of records to return (max 100, default 100).',
            required: false,
        }),
        skip: Property.Number({
            displayName: 'Offset',
            description: 'Number of records to skip.',
            required: false,
        }),
    },
    async run(context) {
        const { realm, approvableType, user, passwordAdapter, count, top, skip } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
        };

        const filters: string[] = [];
        if (approvableType) {
            filters.push(`approvableType eq '${approvableType}'`);
        }
        if (user) {
            filters.push(`user eq '${user}'`);
        }
        if (passwordAdapter) {
            filters.push(`passwordAdapter eq '${passwordAdapter}'`);
        }

        if (filters.length > 0) {
            queryParams['$filter'] = filters.join(' and ');
        }
        if (count) {
            queryParams['$count'] = 'true';
        }
        if (top) {
            queryParams['$top'] = top.toString();
        }
        if (skip) {
            queryParams['$skip'] = skip.toString();
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/pendingApprovables',
            queryParams
        );

        return response;
    },
});

