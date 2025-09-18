import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { customerIdDropdown } from '../common/props';

export const stripeUpdateCustomer = createAction({
    name: 'update_customer',
    auth: stripeAuth,
    displayName: 'Update Customer',
    description: 'Modify an existing customer’s details',
    props: {
        // CHANGED: Use the imported dropdown directly
        customer_id: customerIdDropdown, 
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        line1: Property.ShortText({
            displayName: 'Address Line 1',
            required: false,
        }),
        postal_code: Property.ShortText({
            displayName: 'Postal Code',
            required: false,
        }),
        city: Property.ShortText({
            displayName: 'City',
            required: false,
        }),
        state: Property.ShortText({
            displayName: 'State',
            required: false,
        }),
        country: Property.ShortText({
            displayName: 'Country',
            description: "Two-letter country code (e.g., US, GB).",
            required: false,
        }),
    },
    async run(context) {
        const customerId = context.propsValue.customer_id;

        const body: { [key: string]: any } = {};
        if (context.propsValue.email) body['email'] = context.propsValue.email;
        if (context.propsValue.name) body['name'] = context.propsValue.name;
        if (context.propsValue.description) body['description'] = context.propsValue.description;
        if (context.propsValue.phone) body['phone'] = context.propsValue.phone;
        
        const address: { [key: string]: any } = {};
        if (context.propsValue.line1) address['line1'] = context.propsValue.line1;
        if (context.propsValue.postal_code) address['postal_code'] = context.propsValue.postal_code;
        if (context.propsValue.city) address['city'] = context.propsValue.city;
        if (context.propsValue.state) address['state'] = context.propsValue.state;
        if (context.propsValue.country) address['country'] = context.propsValue.country;

        if (Object.keys(address).length > 0) {
            // Stripe expects address fields to be nested under an 'address' key
            // and properly formatted for form-urlencoded requests.
            Object.keys(address).forEach(key => {
                body[`address[${key}]`] = address[key];
            });
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/customers/${customerId}`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        return response.body;
    },
});