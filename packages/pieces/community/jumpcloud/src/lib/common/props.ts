import { Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { DEFAULT_MAX_ITEMS, DEFAULT_PAGE_SIZE, jumpcloudApi, MAX_FETCH_ALL_ITEMS, MAX_PAGE_SIZE } from './client';
import { jumpcloudObjects } from './objects';

export const jumpcloudProps = {
    objectType,
    objectId,
    pagination,
};

function objectType({ creatableOnly = false }: { creatableOnly?: boolean } = {}) {
    return Property.StaticDropdown({
        displayName: 'Object Type',
        description: 'The kind of JumpCloud object to work with.',
        required: true,
        defaultValue: 'user',
        options: {
            disabled: false,
            options: jumpcloudObjects.typeOptions({ creatableOnly }),
        },
    });
}

function objectId({ displayName = 'Object', description }: { displayName?: string; description?: string } = {}) {
    return Property.Dropdown({
        auth: jumpcloudAuth,
        displayName,
        description: description ?? 'Pick the object, or type to search by name. You can also map an ID from an earlier step.',
        required: true,
        refreshers: ['objectType'],
        refreshOnSearch: true,
        options: async ({ auth, objectType }, { searchValue }) => {
            if (auth === undefined) {
                return { disabled: true, options: [], placeholder: 'Connect your JumpCloud account first.' };
            }
            if (!jumpcloudObjects.isObjectType(objectType)) {
                return { disabled: true, options: [], placeholder: 'Select an object type first.' };
            }
            try {
                const page = await jumpcloudObjects.searchPage({
                    auth: auth.props,
                    type: objectType,
                    term: searchValue ?? '',
                    page: { limit: PICKER_PAGE_SIZE, skip: 0 },
                });
                const options = page.items.flatMap((record) => {
                    const id = jumpcloudObjects.readId({ type: objectType, record });
                    return id === null ? [] : [{ label: jumpcloudObjects.optionLabel({ type: objectType, record }), value: id }];
                });
                return {
                    disabled: false,
                    options,
                    placeholder: options.length === 0 ? 'No matching objects found.' : undefined,
                };
            } catch (error) {
                return { disabled: true, options: [], placeholder: jumpcloudApi.describeError(error) };
            }
        },
    });
}

function pagination() {
    return {
        limit: Property.Number({
            displayName: 'Max Results',
            description: `How many objects to return per run, from 1 to ${MAX_PAGE_SIZE}. Ignored when Fetch All Pages is on.`,
            required: false,
            defaultValue: DEFAULT_PAGE_SIZE,
            display: 'stepper',
            min: 1,
            max: MAX_PAGE_SIZE,
            step: 1,
        }),
        skip: Property.Number({
            displayName: 'Skip',
            description: 'How many objects to skip before the first result. Use the Next Skip value from a previous run to get the next page.',
            required: false,
            defaultValue: 0,
            advanced: true,
        }),
        fetchAll: Property.Checkbox({
            displayName: 'Fetch All Pages',
            description: 'Keep requesting pages until every object is returned, up to Max Objects.',
            required: false,
            defaultValue: false,
            reveals: ['maxItems'],
        }),
        maxItems: Property.Number({
            displayName: 'Max Objects',
            description: `Safety cap when fetching all pages, up to ${MAX_FETCH_ALL_ITEMS}.`,
            required: false,
            defaultValue: DEFAULT_MAX_ITEMS,
        }),
    };
}

const PICKER_PAGE_SIZE = 50;
