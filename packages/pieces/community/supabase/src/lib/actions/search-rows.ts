import { createAction, Property } from "@activepieces/pieces-framework";
import { supabaseAuth } from '../auth';
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";
import { searchRowsActionOutputSchema } from '../output-schemas';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'containedBy';

interface Filter {
    field: string;
    operator: FilterOperator;
    value: string | number | boolean | null;
}

export const searchRows = createAction({
    name: 'search_rows',
    classification: 'SEARCH',
    displayName: 'Search Rows',
    description: 'Search for rows in a table with filters and pagination',
    audience: 'both',
    aiMetadata: { description: 'Queries rows from a Supabase table, applying an optional list of column filters (equality, comparison, LIKE, in-list, JSON containment) with column selection and page-based pagination. Use to look up or list records before acting on them, or to fetch a specific subset. Read-only and idempotent.', idempotent: true },
    auth: supabaseAuth,
    propertyGroups: [
        {
            key: 'query',
            display: 'section',
            label: 'Query',
            icon: 'filter',
            props: ['table_name', 'columns', 'filters'],
        },
        {
            key: 'paging',
            display: 'section',
            label: 'Pagination',
            icon: 'sliders',
            props: ['page', 'pageSize', 'countOption'],
        },
    ],
    props: {
        table_name: supabaseCommon.table_name,
        columns: Property.ShortText({
            displayName: 'Columns',
            description: 'Comma-separated. Leave empty to return every column.',
            placeholder: 'id, name, email',
            required: false,
        }),
        filters: Property.Array({
            displayName: 'Filters',
            description: 'A row is returned only if it matches every filter.',
            required: false,
            properties: {
                field: Property.ShortText({
                    displayName: 'Column',
                    description: 'Use -> for a JSON key.',
                    placeholder: 'address->city',
                    required: true,
                }),
                operator: Property.StaticDropdown({
                    displayName: 'Condition',
                    description: 'How the column is compared with the value.',
                    required: true,
                    options: {
                        options: [
                            { label: 'Equals', value: 'eq' },
                            { label: 'Does not equal', value: 'neq' },
                            { label: 'Greater than', value: 'gt' },
                            { label: 'Greater than or equal to', value: 'gte' },
                            { label: 'Less than', value: 'lt' },
                            { label: 'Less than or equal to', value: 'lte' },
                            { label: 'Matches pattern', value: 'like' },
                            { label: 'Matches pattern, any case', value: 'ilike' },
                            { label: 'Is', value: 'is' },
                            { label: 'Is one of', value: 'in' },
                            { label: 'Contains', value: 'contains' },
                            { label: 'Is contained by', value: 'containedBy' },
                        ]
                    }
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'For Is one of, separate values with commas.',
                    placeholder: 'active',
                    required: true,
                }),
            }
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Starts at 1.',
            required: false,
            defaultValue: 1,
        }),
        pageSize: Property.Number({
            displayName: 'Rows Per Page',
            description: 'Between 1 and 1000.',
            required: false,
            defaultValue: 20,
            display: 'stepper',
            min: 1,
            max: 1000,
            step: 1,
        }),
        countOption: Property.StaticDropdown({
            displayName: 'Total Count',
            description: 'Leave empty to skip counting; count is then 0.',
            required: false,
            options: {
                options: [
                    { label: 'Exact', value: 'exact' },
                    { label: 'Planned', value: 'planned' },
                    { label: 'Estimated', value: 'estimated' },
                ]
            }
        }),
    },
    outputSchema: searchRowsActionOutputSchema,
    async run(context) {
        const { table_name, columns, filters, page, pageSize, countOption } = context.propsValue;
        const { url, apiKey } = context.auth.props;

        const currentPage = Math.max(1, page || 1);
        const currentPageSize = Math.min(1000, Math.max(1, pageSize || 20));
        
        if (columns && !/^[a-zA-Z0-9_,.\s\->"*]+$/.test(columns)) {
            throw new Error('Invalid column specification. Only alphanumeric characters, underscores, commas, dots, arrows, quotes, and asterisks are allowed.');
        }

        const supabase = createClient(url, apiKey);
        
        let query = supabase.from(table_name as string).select(
            columns || '*', 
            { count: countOption as 'exact' | 'planned' | 'estimated' | undefined }
        );

        if (filters && Array.isArray(filters) && filters.length > 0) {
            for (const filter of filters as Filter[]) {
                if (!filter.field || !filter.operator) {
                    throw new Error('Filter must have both field and operator specified');
                }
                
                if (!/^[a-zA-Z0-9_.\->"]+$/.test(filter.field)) {
                    throw new Error(`Invalid field name: ${filter.field}. Only alphanumeric characters, underscores, dots, and arrows are allowed.`);
                }

                try {
                    switch (filter.operator) {
                        case 'eq':
                            query = query.eq(filter.field, filter.value);
                            break;
                        case 'neq':
                            query = query.neq(filter.field, filter.value);
                            break;
                        case 'gt':
                            query = query.gt(filter.field, filter.value);
                            break;
                        case 'gte':
                            query = query.gte(filter.field, filter.value);
                            break;
                        case 'lt':
                            query = query.lt(filter.field, filter.value);
                            break;
                        case 'lte':
                            query = query.lte(filter.field, filter.value);
                            break;
                        case 'like':
                            query = query.like(filter.field, String(filter.value));
                            break;
                        case 'ilike':
                            query = query.ilike(filter.field, String(filter.value));
                            break;
                        case 'is':
                            query = query.is(filter.field, filter.value);
                            break;
                        case 'in': {
                            const inValues = Array.isArray(filter.value) ? filter.value : String(filter.value).split(',');
                            query = query.in(filter.field, inValues);
                            break;
                        }
                        case 'contains':
                            if (typeof filter.value === 'string' || Array.isArray(filter.value) || (filter.value && typeof filter.value === 'object')) {
                                query = query.contains(filter.field, filter.value);
                            } else {
                                throw new Error('Contains operator requires string, array, or object value');
                            }
                            break;
                        case 'containedBy':
                            if (typeof filter.value === 'string' || Array.isArray(filter.value) || (filter.value && typeof filter.value === 'object')) {
                                query = query.containedBy(filter.field, filter.value);
                            } else {
                                throw new Error('ContainedBy operator requires string, array, or object value');
                            }
                            break;
                        default:
                            throw new Error(`Unsupported filter operator: ${filter.operator}`);
                    }
                } catch (filterError) {
                    throw new Error(`Failed to apply filter on field '${filter.field}' with operator '${filter.operator}': ${filterError instanceof Error ? filterError.message : 'Unknown error'}`);
                }
            }
        }

        const from = (currentPage - 1) * currentPageSize;
        const to = from + currentPageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Database query failed: ${error.message}`);
        }

        return {
            data: data || [],
            count: count || 0,
            page: currentPage,
            pageSize: currentPageSize,
            total_pages: count ? Math.ceil(count / currentPageSize) : 0,
            range: {
                from,
                to,
                returned: data?.length || 0
            }
        };
    },
});