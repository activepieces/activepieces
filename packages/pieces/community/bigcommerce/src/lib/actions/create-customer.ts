
import { createAction, DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props"; 
import { BigCommerceClient } from "../common/client";

export const createCustomer = createAction({
    auth: bigcommerceAuth,
    name: 'create_customer',
    displayName: 'Create Customer',
    description: 'Creates a new customer.',

    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the customer.',
            required: true,
        }),
        company: Property.ShortText({
            displayName: 'Company',
            description: 'The company of the customer.',
            required: false,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Notes or comments about the customer.',
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
        
        const customerObject: Record<string, unknown> = {
            email,
            first_name,
            last_name,
        };

        if (company) customerObject['company'] = company;
        if (phone) customerObject['phone'] = phone;
        if (notes) customerObject['notes'] = notes;
        
        if (address && Object.keys(address as DynamicPropsValue).length > 0) {
            customerObject['addresses'] = [address];
        }

        const payload = [customerObject];

        const response = await client.makeRequest(
            HttpMethod.POST,
            '/v3/customers',
            payload
        );
        
        return response;
    },
});