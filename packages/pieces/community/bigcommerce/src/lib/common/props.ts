

import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { BigCommerceClient, BigCommerceCountry } from './client';
import { BigCommerceAuth } from './auth';

export const bigcommerceProps = {
    first_name: (required = true) => Property.ShortText({
        displayName: 'First Name',
        description: 'The first name.',
        required: required,
    }),
    last_name: (required = true) => Property.ShortText({
        displayName: 'Last Name',
        description: 'The last name.',
        required: required,
    }),
    phone: (required = false) => Property.ShortText({
        displayName: 'Phone',
        description: 'The phone number.',
        required: required,
    }),
    customerId: (required = true) => Property.Dropdown({
        displayName: 'Customer',
        description: 'The customer to associate with.',
        required: required,
        refreshers: [],
        options: async (context) => {
            const auth = context['auth'] as BigCommerceAuth | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            const client = new BigCommerceClient(auth);
            const customers = await client.getCustomers();
            return {
                disabled: false,
                options: customers.map((customer) => ({
                    label: `${customer.first_name} ${customer.last_name} (${customer.email})`,
                    value: customer.id,
                })),
            };
        },
    }),
    address: (required = false) => Property.DynamicProperties({
        displayName: 'Address',
        description: 'A single address.',
        required: required,
        refreshers: [],
        props: async () => {
            const fields: DynamicPropsValue = {};
            fields['first_name'] = bigcommerceProps.first_name(true);
            fields['last_name'] = bigcommerceProps.last_name(true);
            fields['street_1'] = Property.ShortText({ displayName: 'Street 1', required: true });
            fields['street_2'] = Property.ShortText({ displayName: 'Street 2', required: false });
            fields['city'] = Property.ShortText({ displayName: 'City', required: true });
            fields['state'] = Property.ShortText({ displayName: 'State', description: "State or province name.", required: true });
            fields['zip'] = Property.ShortText({ displayName: 'Zip', description: "Zip or postal code.", required: true });
            fields['country'] = Property.ShortText({ displayName: 'Country', description: "Country code (e.g., 'US', 'CA', 'GB').", required: true });
            fields['phone'] = bigcommerceProps.phone(false);
            return fields;
        }
    }),
    product_categories: (required = false) => Property.MultiSelectDropdown({
        displayName: 'Categories',
        description: 'Categories to assign the product to.',
        required: required,
        refreshers: [],
        options: async (context) => {
            const auth = context['auth'] as BigCommerceAuth | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            const client = new BigCommerceClient(auth);
            const categories = await client.getCategories();
            return {
                disabled: false,
                options: categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                })),
            };
        },
    }),
    countryCode: (required = true) => Property.Dropdown({
        displayName: 'Country',
        description: 'The country code.',
        required: required,
        refreshers: [],
        options: async (context) => {
            const auth = context['auth'] as BigCommerceAuth | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            const client = new BigCommerceClient(auth);
            const countries = await client.getCountries();
            return {
                disabled: false,
                options: countries.map((country) => ({
                    label: country.country,
                    value: country.country_iso2,
                })),
            };
        },
    }),

    stateOrProvince: (required = true) => Property.Dropdown({
        displayName: 'State / Province',
        description: 'The state or province.',
        required: required,
        refreshers: ['country_code'], 
        options: async (context) => {
            const auth = context['auth'] as BigCommerceAuth | undefined;
            const propsValue = context['propsValue'] as Record<string, unknown>;
            const countryCode = propsValue['country_code'] as string | undefined;

            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            if (!countryCode) {
                return { disabled: true, placeholder: 'Select a country first', options: [] };
            }

            const client = new BigCommerceClient(auth);
            const countries = await client.getCountries();
            const selectedCountry = countries.find(c => c.country_iso2 === countryCode);

            if (!selectedCountry) {
                return { disabled: true, placeholder: 'Error finding country ID', options: [] };
            }

            const states = await client.getStatesForCountry(selectedCountry.id);
            if (states.length === 0) {
                return { disabled: true, placeholder: 'No states found for this country', options: [] };
            }
            
            return {
                disabled: false,
                options: states.map((state) => ({
                    label: state.state,
                    value: state.state_abbreviation, 
                })),
            };
        },
    }),
};