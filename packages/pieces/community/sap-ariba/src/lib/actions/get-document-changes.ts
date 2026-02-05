import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const getDocumentChanges = createAction({
    auth: sapAribaAuth,
    name: 'get_document_changes',
    displayName: 'Get Document Changes',
    description: 'Returns the list of changes to approvable documents.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Unique identifier of the realm.',
            required: true,
        }),
        changeSequenceId: Property.Number({
            displayName: 'Change Sequence ID',
            description: 'Only return changes after this sequence ID. Leave empty to get all changes.',
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
            description: 'Number of records to return (max 1000, default 10).',
            required: false,
        }),
        skip: Property.Number({
            displayName: 'Offset',
            description: 'Number of records to skip.',
            required: false,
        }),
    },
    async run(context) {
        const { realm, changeSequenceId, count, top, skip } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
        };

        if (changeSequenceId !== undefined && changeSequenceId !== null) {
            queryParams['$filter'] = `changeSequenceId gt ${changeSequenceId}`;
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
            '/changes',
            queryParams
        );

        return response;
    },
});

