import { oracleFusionCloudErpAuth } from '../../index';
import {
    DropdownOption,
    DynamicPropsValue,
    PiecePropValueSchema,
    Property,
} from '@activepieces/pieces-framework';
import { makeClient } from './client';
import { BUSINESS_OBJECT_TYPES } from './constants';

export const commonProps = {
    business_object: Property.StaticDropdown({
        displayName: 'Business Object',
        required: true,
        options: {
            disabled: false,
            options: BUSINESS_OBJECT_TYPES,
        },
    }),
    record_id: Property.ShortText({
        displayName: 'Record ID',
        description: 'The unique identifier of the record',
        required: true,
    }),
    record_fields: Property.Object({
        displayName: 'Record Fields',
        description: 'The fields and values for the record. Use JSON format.',
        required: true,
    }),
    search_query: Property.Object({
        displayName: 'Search Query',
        description: 'Search criteria in JSON format (e.g., {"field": "value"})',
        required: true,
    }),
    limit: Property.Number({
        displayName: 'Limit',
        description: 'Maximum number of records to return (default: 25, max: 100)',
        required: false,
        defaultValue: 25,
    }),
    offset: Property.Number({
        displayName: 'Offset',
        description: 'Number of records to skip (for pagination)',
        required: false,
        defaultValue: 0,
    }),
};
