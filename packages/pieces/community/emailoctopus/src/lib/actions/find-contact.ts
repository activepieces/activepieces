import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon, emailoctopusSchemas } from '../common/client';
import { listDropdown } from '../common/properties';

export const findContact = createAction({
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Find contacts in a list with optional filters',
    auth: emailoctopusAuth,
    props: {
        list_id: listDropdown({ required: true }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'Filter by email address (partial matches supported)',
            required: false,
        }),
        tag: Property.ShortText({
            displayName: 'Tag',
            description: 'Filter by tag associated with the contact',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter by contact status',
            required: false,
            options: {
                options: [
                    { label: 'Subscribed', value: 'subscribed' },
                    { label: 'Unsubscribed', value: 'unsubscribed' },
                    { label: 'Pending', value: 'pending' }
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of results per page (default: 100)',
            required: false,
        }),
        starting_after: Property.ShortText({
            displayName: 'Starting After',
            description: 'Cursor that points to the end of the page for pagination',
            required: false,
        }),
        created_at_lte: Property.DateTime({
            displayName: 'Created At (Less Than or Equal)',
            description: 'Filter by creation date - less than or equal to',
            required: false,
        }),
        created_at_gte: Property.DateTime({
            displayName: 'Created At (Greater Than or Equal)',
            description: 'Filter by creation date - greater than or equal to',
            required: false,
        }),
        last_updated_at_lte: Property.DateTime({
            displayName: 'Last Updated At (Less Than or Equal)',
            description: 'Filter by update date - less than or equal to',
            required: false,
        }),
        last_updated_at_gte: Property.DateTime({
            displayName: 'Last Updated At (Greater Than or Equal)',
            description: 'Filter by update date - greater than or equal to',
            required: false,
        }),
    },
    async run(context) {
        await propsValidation.validateZod(context.propsValue, emailoctopusSchemas.findContact);
        const {
            list_id,
            email_address,
            tag,
            status,
            limit,
            starting_after,
            created_at_lte,
            created_at_gte,
            last_updated_at_lte,
            last_updated_at_gte
        } = context.propsValue;

        const queryParams: Record<string, string> = {};

        if (email_address) queryParams['email'] = email_address;
        if (tag) queryParams['tag'] = tag;
        if (status) queryParams['status'] = status;
        if (limit) queryParams['limit'] = limit.toString();
        if (starting_after) queryParams['starting_after'] = starting_after;
        if (created_at_lte) queryParams['created_at.lte'] = created_at_lte;
        if (created_at_gte) queryParams['created_at.gte'] = created_at_gte;
        if (last_updated_at_lte) queryParams['last_updated_at.lte'] = last_updated_at_lte;
        if (last_updated_at_gte) queryParams['last_updated_at.gte'] = last_updated_at_gte;

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: `/lists/${list_id}/contacts`,
            queryParams
        });

        return response.body;
    },
});
