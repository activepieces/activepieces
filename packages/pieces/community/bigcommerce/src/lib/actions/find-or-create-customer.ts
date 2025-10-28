

import { createAction, DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props"; 
import { BigCommerceClient, BigCommerceCustomer } from "../common/client";

export const findOrCreateCustomer = createAction({
    auth: bigcommerceAuth,
    name: 'find_or_create_customer',
    displayName: 'Find or Create Customer',
    description: 'Finds a customer by email. If the customer does not exist, a new one will be created.',

    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: "The customer's email address. Used to find or create.",
            required: true,
        }),
        company: Property.ShortText({
            displayName: 'Company',
            description: 'The company of the customer (used if creating).',
            required: false,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Notes or comments about the customer (used if creating).',
            required: false,
        }),
        first_name: bigcommerceProps.first_name(true), 
        last_name: bigcommerceProps.last_name(true), 
        phone: bigcommerceProps.phone(false),
        address: bigcommerceProps.address(false)
    },

    async run(context) {
        const { email, first_name, last_name, company, phone, notes, address } = context.propsValue;
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);

        const query: QueryParams = {
            'email:in': email as string,
            'limit': '1'
        };
        
        const findResponse = await client.makeRequest<{ data: BigCommerceCustomer[] }>(
            HttpMethod.GET,
            '/v3/customers',
            undefined,
            query
        );

        if (findResponse.data && findResponse.data.length > 0) {
            return {
                status: "found",
                customer: findResponse.data[0]
            };
        }

        const createBody: Record<string, unknown> = {
            email,
            first_name,
            last_name,
        };

        if (company) createBody['company'] = company;
        if (phone) createBody['phone'] = phone;
        if (notes) createBody['notes'] = notes;
        
        if (address && Object.keys(address as DynamicPropsValue).length > 0) {
            createBody['addresses'] = [address];
        }

        const createPayload = [createBody];

        const createResponse = await client.makeRequest<{ data: BigCommerceCustomer[] }>(
            HttpMethod.POST,
            '/v3/customers',
            createPayload
        );
        
        return {
            status: "created",
            customer: createResponse.data[0]
        };
    },
});