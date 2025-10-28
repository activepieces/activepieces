
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props";
import { BigCommerceClient, BigCommerceAddress } from "../common/client";

export const findOrCreateCustomerAddress = createAction({
    auth: bigcommerceAuth,
    name: 'find_or_create_customer_address',
    displayName: 'Find or Create Customer’s Address',
    description: 'Finds an address for a customer. If not found, a new one will be created.',

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
            description: 'The first line of the street address. Used as the unique key for finding.',
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
            description: 'The zip or postal code. Used as part of the unique key for finding.',
            required: true,
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

        const findResponse = await client.makeRequest<{ data: BigCommerceAddress[] }>(
            HttpMethod.GET,
            `/v3/customers/${customer_id}/addresses`
        );

        const existingAddress = findResponse.data.find(addr => 
            addr.street_1.toLowerCase() === (street_1 as string).toLowerCase() &&
            addr.postal_code.toLowerCase() === (postal_code as string).toLowerCase() &&
            addr.country_code.toLowerCase() === (country_code as string).toLowerCase()
        );

        if (existingAddress) {
            return {
                status: "found",
                address: existingAddress
            };
        }


        const createBody: Record<string, unknown> = {
            customer_id,
            first_name,
            last_name,
            street_1,
            city,
            country_code,
            state_or_province,
            postal_code,
        };

        if (phone) createBody['phone'] = phone;
        if (company) createBody['company'] = company;
        if (street_2) createBody['street_2'] = street_2;
        if (address_type) createBody['address_type'] = address_type;

        const payload = [createBody];

        const createResponse = await client.makeRequest<{ data: BigCommerceAddress[] }>(
            HttpMethod.POST,
            '/v3/customers/addresses', 
            payload
        );

        return {
            status: "created",
            address: createResponse.data[0]
        };
    },
});