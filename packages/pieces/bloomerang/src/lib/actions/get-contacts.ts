import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';
import { bloomerangAuth } from '../../';

export const bloomerangGetContacts = createAction({
    auth: bloomerangAuth,
        name: 'get_contacts',
        description: 'Get all contacts after date',
        displayName: 'Get contacts',
        props: {
            last_modified_date: Property.ShortText({
                displayName: "Last Modified Date",
                description: "The date to search for contacts modified after",
                defaultValue: "1970-01-01T00:00:00.000Z",
                required: true
            }),
            skip: Property.Number({
                displayName: "The number of items to skip",
                description: "The number of items to skip before starting to collect the result set.",
                required: false
            }),
            take: Property.Number({
                displayName: "The number of items to include",
                description: "The number of items to include in the result set.",
                required: false
            }),
            is_favorite: Property.Checkbox({
                displayName: "Is favorite",
                description: "Filters constituents to only constituents the user has favorited.",
                defaultValue: false,
                required: false,
            }),
            type: bloomerangCommon.contact_type,
            order_by: Property.ShortText({
                displayName: "Sorts by Id, CreatedDate, or LastModifiedDate (default Id)",
                description: "Available values : Id, CreatedDate, LastModifiedDate",
                required: false
            }),
            order_direction: Property.ShortText({
                displayName: "Sorts the orderBy in ascending or descending order.",
                description: "Available values : Asc, Desc",
                required: false
            }),
            id: Property.Array({
                displayName: "IDs list",
                description: "Filters results based on the ID for the constituent.",
                required: false
            }),
        },
        async run(context) {
            const { last_modified_date, take, id, order_by, skip, type, order_direction, is_favorite } = context.propsValue;
            let url = `${bloomerangCommon.baseUrl}/constituents?lastModified=${last_modified_date}`;
            if (take) url += `&take=${take}`;
            if (skip) url += `&skip=${skip}`;
            if (is_favorite) url += `&isFavorite=${is_favorite}`;
            if (type) url += `&type=${type}`;
            if (order_by) url += `&orderBy=${order_by}`;
            if (order_direction) url += `&orderDirection=${order_direction}`;
            if (id && id.length > 0) {
                const parserId = id.map((el: any) => `id=${el}`)
                url += parserId.join('&');
            }
            return (await httpClient.sendRequest({
                method: HttpMethod.GET,
                url,
                headers: {
                    "X-API-KEY": context.auth,
                },
            })).body;
        }
});
