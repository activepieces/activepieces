import { createAction, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';
import { ApiVersion, ConnectionProps, ListPage, ObjectTypeKey, PageRequest } from '../common/types';

export const searchObjectsAction = createAction({
    auth: jumpcloudAuth,
    name: 'search_objects',
    classification: 'SEARCH',
    displayName: 'Search Objects (Batch)',
    description: 'Find users, devices, groups or applications by text or by a field value.',
    audience: 'both',
    aiMetadata: {
        description:
            'Searches JumpCloud objects of one type either by free text (names, usernames, emails, hostnames) or by one field condition such as department equals Finance, with paging. Returns items plus total_count and next_skip. Use Search User by Employee ID for that exact lookup. Safe to retry.',
        idempotent: true,
    },
    props: {
        objectType: jumpcloudProps.objectType(),
        searchText: Property.ShortText({
            displayName: 'Search Text',
            description: 'Matches names, usernames, emails or hostnames. Leave empty to filter by a field instead.',
            required: false,
        }),
        filterField: Property.ShortText({
            displayName: 'Filter Field',
            description: 'A JumpCloud field name, for example department, jobTitle, email or name. Leave empty to search by text.',
            required: false,
        }),
        filterOperator: Property.StaticDropdown({
            displayName: 'Filter Operator',
            required: false,
            defaultValue: 'equals',
            options: {
                disabled: false,
                options: [
                    { label: 'Equals', value: 'equals' },
                    { label: 'Does not equal', value: 'not_equals' },
                    { label: 'Starts with (contains for groups)', value: 'starts_with' },
                    { label: 'Is one of (separate values with |)', value: 'in' },
                    { label: 'Greater than', value: 'greater_than' },
                    { label: 'Greater than or equal', value: 'greater_or_equal' },
                    { label: 'Less than', value: 'less_than' },
                    { label: 'Less than or equal', value: 'less_or_equal' },
                ],
            },
        }),
        filterValue: Property.ShortText({
            displayName: 'Filter Value',
            description: 'The value to compare with. Matching is case-sensitive.',
            required: false,
        }),
        ...jumpcloudProps.pagination(),
    },
    async run(context) {
        const auth = context.auth.props;
        const { limit, skip, fetchAll, maxItems, searchText, filterField, filterOperator, filterValue } = context.propsValue;
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const fetchPage = pageFetcher({ auth, type, searchText, filterField, filterOperator, filterValue });
        const result = await jumpcloudApi.collectPages({ fetchPage, limit, skip, fetchAll, maxItems });
        return { ...result, items: result.items.map((record) => jumpcloudOutput.flatten({ type, record })) };
    },
});

function pageFetcher({ auth, type, searchText, filterField, filterOperator, filterValue }: SearchInput): (page: PageRequest) => Promise<ListPage> {
    const text = searchText?.trim() ?? '';
    const field = filterField?.trim() ?? '';
    if (text.length > 0 && field.length > 0) {
        throw new Error('Use either Search Text or a Filter Field, not both.');
    }
    if (field.length > 0) {
        const value = filterValue?.trim() ?? '';
        if (value.length === 0) {
            throw new Error('Enter a Filter Value for the Filter Field.');
        }
        const filter = `${field}:${resolveOperator({ operator: filterOperator, version: jumpcloudObjects.config(type).version })}:${value}`;
        return (page) => jumpcloudObjects.listPage({ auth, type, page, filter });
    }
    if (text.length === 0) {
        throw new Error('Enter Search Text, or a Filter Field and Filter Value.');
    }
    return jumpcloudObjects.searchPager({ auth, type, term: text });
}

function resolveOperator({ operator, version }: { operator: string | undefined; version: ApiVersion }): string {
    const mapped = OPERATORS[operator ?? 'equals'];
    if (mapped === undefined) {
        throw new Error(`Unknown Filter Operator "${operator}".`);
    }
    return mapped[version];
}

const OPERATORS: Record<string, Record<ApiVersion, string>> = {
    equals: { v1: '$eq', v2: 'eq' },
    not_equals: { v1: '$ne', v2: 'ne' },
    starts_with: { v1: '$sw', v2: 'search' },
    in: { v1: '$in', v2: 'in' },
    greater_than: { v1: '$gt', v2: 'gt' },
    greater_or_equal: { v1: '$gte', v2: 'ge' },
    less_than: { v1: '$lt', v2: 'lt' },
    less_or_equal: { v1: '$lte', v2: 'le' },
};

type SearchInput = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    searchText: string | undefined;
    filterField: string | undefined;
    filterOperator: string | undefined;
    filterValue: string | undefined;
};
