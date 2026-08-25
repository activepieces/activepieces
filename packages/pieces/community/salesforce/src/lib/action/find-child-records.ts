import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const findChildRecords = createAction({
    auth: salesforceAuth,
    name: 'find_child_records',
    displayName: 'Find Child Records',
    description: 'Finds child records related to a parent record.',
    audience: 'both',
    aiMetadata: { description: 'List the child records on one side of a parent record relationship (e.g. the Contacts under an Account) by parent ID and child-relationship name (read-only). Use when you already have a parent record and want its related records via a defined relationship; for arbitrary filtered lookups use Run Query instead.', idempotent: true },
    props: {
        parent_object: salesforcesCommon.object,
        parent_id: salesforcesCommon.parentRecord,
        child_relationship: salesforcesCommon.childRelationship,
    },
    async run(context) {
        const { parent_id, child_relationship } = context.propsValue;

        const response = await callSalesforceApi(
            HttpMethod.GET,
            context.auth,
            `/services/data/v56.0/ui-api/records/${parent_id}/child-relationships/${child_relationship}`,
            undefined
        );

        return response.body;
    },
});