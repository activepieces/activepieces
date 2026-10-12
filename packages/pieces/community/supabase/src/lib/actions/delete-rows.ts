import { createAction, MarkdownVariant, Property } from "@activepieces/pieces-framework";
import { supabaseAuth } from '../auth';
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";
import { deleteRowsActionOutputSchema } from '../output-schemas';

export const deleteRows = createAction({
    name: 'delete_rows',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Rows',
    description: 'Remove rows matching filter criteria from a table',
    audience: 'both',
    aiMetadata: { description: 'Deletes rows from a Supabase table that match a single filter condition (equals, not-equals, in-list, range comparisons, null checks, or LIKE pattern on a chosen column). Use to remove records you can identify by one filter; a filter is required so it will not blindly clear a table. Idempotent: re-running deletes nothing further once the matching rows are gone.', idempotent: true },
    auth: supabaseAuth,
    propertyGroups: [
        {
            key: 'target',
            display: 'section',
            label: 'Rows to Delete',
            icon: 'trash',
            props: ['table_name', 'delete_warning', 'filter_column', 'filter_type', 'filter_value', 'filter_values'],
        },
        {
            key: 'output',
            display: 'section',
            label: 'Output',
            icon: 'sliders',
            props: ['count_deleted', 'return_deleted'],
        },
    ],
    props: {
        table_name: supabaseCommon.table_name,
        delete_warning: Property.MarkDown({
            value: 'Every row that matches is deleted. This cannot be undone.',
            variant: MarkdownVariant.WARNING,
        }),
        filter_column: Property.Dropdown({
            auth: supabaseAuth,
            displayName: 'Column',
            description: 'Rows are matched on this column.',
            required: true,
            refreshers: ['table_name'],
            options: async ({ auth, table_name }) => {
                if (!auth || !table_name) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a table first'
                    };
                }
                
                try {
                    const { url, apiKey } = auth.props;
                    const supabase = createClient(url, apiKey);
                    
                    try {
                        const { data: columns, error } = await supabase.rpc('get_table_columns', { 
                            p_table_name: table_name as unknown as string 
                        });
                        
                        if (!error && columns && columns.length > 0) {
                            return {
                                disabled: false,
                                options: columns.map((col: any) => ({
                                    label: `${col.column_name} (${col.data_type})`,
                                    value: col.column_name
                                }))
                            };
                        }
                    } catch (rpcError) {
                        // Continue to OpenAPI fallback
                    }
                    
                    const response = await fetch(`${url}/rest/v1/`, {
                        method: 'GET',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Accept': 'application/openapi+json'
                        }
                    });

                    if (response.ok) {
                        const openApiSpec = await response.json();
                        const definitions = openApiSpec.definitions || openApiSpec.components?.schemas || {};
                        const tableDefinition = definitions[table_name as unknown as string];
                        
                        if (tableDefinition && tableDefinition.properties) {
                            const options = Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => {
                                const type = columnDef.type || 'unknown';
                                return {
                                    label: `${columnName} (${type})`,
                                    value: columnName
                                };
                            });
                            
                            return {
                                disabled: false,
                                options
                            };
                        }
                    }
                    
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Could not load columns'
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading columns'
                    };
                }
            }
        }),
        filter_type: Property.StaticDropdown({
            displayName: 'Condition',
            description: 'How the column is compared with the value.',
            required: true,
            defaultValue: 'in',
            options: {
                options: [
                    { label: 'Equals', value: 'eq' },
                    { label: 'Does not equal', value: 'neq' },
                    { label: 'Is one of', value: 'in' },
                    { label: 'Greater than', value: 'gt' },
                    { label: 'Greater than or equal to', value: 'gte' },
                    { label: 'Less than', value: 'lt' },
                    { label: 'Less than or equal to', value: 'lte' },
                    { label: 'Is null', value: 'is_null' },
                    { label: 'Is not null', value: 'is_not_null' },
                    { label: 'Matches pattern', value: 'like' },
                    { label: 'Matches pattern, any case', value: 'ilike' }
                ]
            }
        }),
        filter_value: Property.ShortText({
            displayName: 'Value',
            description: 'Not used by Is one of, Is null or Is not null.',
            required: false,
        }),
        filter_values: Property.Array({
            displayName: 'Values',
            description: 'Used only by Is one of.',
            required: false,
        }),
        count_deleted: Property.Checkbox({
            displayName: 'Count Deleted Rows',
            description: 'Adds the number of deleted rows to the output.',
            required: false,
            defaultValue: false,
        }),
        return_deleted: Property.Checkbox({
            displayName: 'Return Deleted Rows',
            description: 'Adds the deleted rows to the output.',
            required: false,
            defaultValue: false,
        })
    },
    outputSchema: deleteRowsActionOutputSchema,
    async run(context) {
        const { 
            table_name, 
            filter_type, 
            filter_column, 
            filter_value, 
            filter_values, 
            count_deleted, 
            return_deleted 
        } = context.propsValue;
        const { url, apiKey } = context.auth.props;

        const supabase = createClient(url, apiKey);
        
        let deleteQuery = supabase
            .from(table_name as string)
            .delete({ 
                count: count_deleted ? 'exact' : undefined 
            });

        const columnName = filter_column as string;
        switch (filter_type) {
            case 'eq':
                if (!filter_value) throw new Error('Filter value is required for equality check');
                deleteQuery = deleteQuery.eq(columnName, filter_value);
                break;
            case 'neq':
                if (!filter_value) throw new Error('Filter value is required for not-equals check');
                deleteQuery = deleteQuery.neq(columnName, filter_value);
                break;
            case 'in':
                if (!filter_values || filter_values.length === 0) {
                    throw new Error('Filter values are required for "in" filter type');
                }
                deleteQuery = deleteQuery.in(columnName, filter_values);
                break;
            case 'gt':
                if (!filter_value) throw new Error('Filter value is required for greater-than check');
                deleteQuery = deleteQuery.gt(columnName, filter_value);
                break;
            case 'gte':
                if (!filter_value) throw new Error('Filter value is required for greater-than-or-equal check');
                deleteQuery = deleteQuery.gte(columnName, filter_value);
                break;
            case 'lt':
                if (!filter_value) throw new Error('Filter value is required for less-than check');
                deleteQuery = deleteQuery.lt(columnName, filter_value);
                break;
            case 'lte':
                if (!filter_value) throw new Error('Filter value is required for less-than-or-equal check');
                deleteQuery = deleteQuery.lte(columnName, filter_value);
                break;
            case 'is_null':
                deleteQuery = deleteQuery.is(columnName, null);
                break;
            case 'is_not_null':
                deleteQuery = deleteQuery.not(columnName, 'is', null);
                break;
            case 'like':
                if (!filter_value) throw new Error('Filter value is required for like pattern matching');
                deleteQuery = deleteQuery.like(columnName, filter_value);
                break;
            case 'ilike':
                if (!filter_value) throw new Error('Filter value is required for case-insensitive like pattern matching');
                deleteQuery = deleteQuery.ilike(columnName, filter_value);
                break;
            default:
                throw new Error(`Unsupported filter type: ${filter_type}`);
        }

        const { data, error, count } = return_deleted 
            ? await deleteQuery.select()
            : await deleteQuery;

        if (error) {
            throw new Error(`Failed to delete rows: ${error.message}`);
        }

        const result: any = {
            success: true,
            deleted_rows: return_deleted ? data : undefined,
        };

        if (count_deleted) {
            result.deleted_count = count;
        }

        return result;
    }
});