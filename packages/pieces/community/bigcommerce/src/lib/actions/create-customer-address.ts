
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props"; 
import { BigCommerceClient } from "../common/client";

export const createCustomerAddress = createAction({
    auth: bigcommerceAuth,
    name: 'create_customer_address',
    displayName: 'Create Customer Address',
    description: 'Creates a new address for a specific customer.',

    props: {
        customer_id: bigcommerceProps.customerId(true),
        first_name: bigcommerceProps.first_name(true),
        last_name: bigcommerceProps.last_name(true),
        phone: bigcommerceProps.phone(false),
        country_code: bigcommerceProps.countryCode(true),
        state_or_province: bigcommerceProps.stateOrProvince(true),

        company: Property.ShortText({
            displayName: 'Company',
            description: 'The company.',
            required: false,
        }),
        street_1: Property.ShortText({
            displayName: 'Street 1',
            description: 'The first line of the street address.',
            required: true,
        }),
        street_2: Property.ShortText({
            displayName: 'Street 2',
            description: 'The second line of the street address.',
            required: false,
        }),
        city: Property.ShortText({
            displayName: 'City',
            description: 'The city.',
            required: true,
        }),
        postal_code: Property.ShortText({
            displayName: 'Postal Code',
            description: 'The zip or postal code.',
            required: false,
        }),
        address_type: Property.StaticDropdown({
            displayName: 'Address Type',
            description: 'The type of address.',
            required: false,
            options: {
                options: [
                    { label: 'Residential', value: 'residential' },
                    { label: 'Commercial', value: 'commercial' },
                ]
            }
        })
    },

    async run(context) {
        const {
            customer_id,
            first_name,
            last_name,
            phone,
            country_code,
            state_or_province,
            company,
            street_1,
            street_2,
            city,
            postal_code,
            address_type
        } = context.propsValue;
        
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);

        const addressObject: Record<string, unknown> = {
            customer_id,
            first_name,
            last_name,
            street_1,
            city,
            country_code,
            state_or_province,
        };

        if (phone) addressObject['phone'] = phone;
        if (company) addressObject['company'] = company;
        if (street_2) addressObject['street_2'] = street_2;
        if (postal_code) addressObject['postal_code'] = postal_code;
        if (address_type) addressObject['address_type'] = address_type;

        const payload = [addressObject];

        const response = await client.makeRequest(
            HttpMethod.POST,
            '/v3/customers/addresses',
            payload
        );

        return response;
    },
});