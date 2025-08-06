import { createAction, Property } from "@activepieces/pieces-framework";
import { supabaseApiAuth } from "../../index";
import { createClient } from "@supabase/supabase-js";

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'containedBy';

interface Filter {
    field: string;
    operator: FilterOperator;
    value: any;
}

export const searchRows = createAction({
    name: 'search_rows',
    displayName: 'Search Rows',
    description: 'Search for rows in a table with filters and pagination',
    auth: supabaseApiAuth,
    props: {
        table: Property.ShortText({
            displayName: 'Table',
            description: 'The name of the table to search in',
            required: true,
        }),
        columns: Property.ShortText({
            displayName: 'Columns',
            description: 'Columns to return (comma-separated). Leave empty to return all columns.',
            required: false,
        }),
        filters: Property.Array({
            displayName: 'Filters',
            description: 'List of filters to apply',
            required: false,
            items: Property.Object({
                displayName: 'Filter',
                description: 'Filter condition',
                required: true,
                properties: {
                    field: Property.ShortText({
                        displayName: 'Field',
                        description: 'Field name to filter on (use -> for JSON fields, e.g. address->postcode)',
                        required: true,
                    }),
                    operator: Property.StaticDropdown({
                        displayName: 'Operator',
                        description: 'Comparison operator',
                        required: true,
                        options: {
                            options: [
                                { label: 'Equals', value: 'eq' },
                                { label: 'Not Equals', value: 'neq' },
                                { label: 'Greater Than', value: 'gt' },
                                { label: 'Greater Than or Equal', value: 'gte' },
                                { label: 'Less Than', value: 'lt' },
                                { label: 'Less Than or Equal', value: 'lte' },
                                { label: 'Like', value: 'like' },
                                { label: 'ILike (Case Insensitive)', value: 'ilike' },
                                { label: 'Is', value: 'is' },
                                { label: 'In', value: 'in' },
                                { label: 'Contains', value: 'contains' },
                                { label: 'Contained By', value: 'containedBy' },
                            ]
                        }
                    }),
                    value: Property.ShortText({
                        displayName: 'Value',
                        description: 'Value to compare against',
                        required: true,
                    }),
                }
            })
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Page number for pagination (starts from 1)',
            required: false,
            defaultValue: 1,
        }),
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'Number of records per page (max 1000)',
            required: false,
            defaultValue: 20,
        }),
        countOption: Property.StaticDropdown({
            displayName: 'Count Algorithm',
            description: 'Algorithm to use for counting rows',
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
    async run(context) {
        const { table, columns, filters, page, pageSize, countOption } = context.propsValue;
        const { url, apiKey } = context.auth;

        const supabase = createClient(url, apiKey);
        
        // Start building the query
        let query = supabase.from(table);

        // Add column selection if specified
        if (columns) {
            query = query.select(columns);
        } else {
            query = query.select('*');
        }

        // Add count if specified
        if (countOption) {
            query = query.select('*', { count: countOption });
        }

        // Add filters if specified
        if (filters && filters.length > 0) {
            filters.forEach((filter: Filter) => {
                if (query[filter.operator]) {
                    query = query[filter.operator](filter.field, filter.value);
                }
            });
        }

        // Add pagination using zero-based indexing
        const from = (page - 1) * pageSize;  // Convert from 1-based to 0-based page numbering
        const to = from + pageSize - 1;      // -1 because range is inclusive
        query = query.range(from, to);

        // Execute the query
        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        return {
            data,
            count,
            page,
            pageSize,
            total_pages: count ? Math.ceil(count / pageSize) : undefined,
            range: {
                from,
                to
            }
        };
    },
});