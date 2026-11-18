import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { successOutputSchema } from '../output-schemas';

export const updateRecord = createAction({
    auth: salesforceAuth,
    name: 'update_record',
    classification: 'WRITE',
    displayName: 'Update Record',
    description: 'Updates fields on a record of any object.',
    audience: 'human',
    aiMetadata: { description: 'Update an existing record of any object, selected by object type and record ID, with a JSON map of fields to change; only supplied fields are modified and the record must already exist. The standard update action — use a stable record ID, not an external ID (use Batch/Bulk Upsert for external-ID matching).', idempotent: false },
    outputSchema: successOutputSchema,
    propertyGroups: [
        { key: 'record', display: 'section', label: 'Record to Update', icon: 'file', props: ['object', 'record_id'] },
        { key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['changes_info', 'data'] },
    ],
    props: {
        object: salesforcesCommon.object,
        record_id: salesforcesCommon.record,
        changes_info: Property.MarkDown({
            value: 'Fields not in the JSON keep their current value.',
            variant: MarkdownVariant.INFO,
        }),
        data: Property.Json({
            displayName: 'Fields',
            description: 'Field API names as keys, with the new values.',
            required: true,
            defaultValue: {},
        }),
    },
    async run(context) {
        const { object, record_id, data } = context.propsValue;

        if (!object) {
            throw new Error('Object is not defined. Please select an object.');
        }

        await callSalesforceApi(
            HttpMethod.PATCH,
            context.auth,
            `/services/data/v56.0/sobjects/${object}/${record_id}`,
            data as Record<string, unknown>
        );

        return {
            success: true,
        };
    },
});