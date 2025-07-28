import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const createCompany = createAction({
    name: 'create_company',
    displayName: 'Create Company',
    description: 'Create a new company record in Teamleader',
    auth: teamleaderAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Company Name',
            description: 'Name of the company',
            required: true,
        }),
        vat_number: Property.ShortText({
            displayName: 'VAT Number',
            description: 'VAT/tax identification number of the company',
            required: false,
        }),
        national_identification_number: Property.ShortText({
            displayName: 'Business Registration Number',
            description: 'Business registration/identification number',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Primary email address of the company',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Primary phone number of the company',
            required: false,
        }),
        website: Property.ShortText({
            displayName: 'Website',
            description: 'Company website URL',
            required: false,
        }),
        address_line_1: Property.ShortText({
            displayName: 'Address Line 1',
            description: 'Street and number',
            required: false,
        }),
        address_postal_code: Property.ShortText({
            displayName: 'Postal Code',
            required: false,
        }),
        address_city: Property.ShortText({
            displayName: 'City',
            required: false,
        }),
        address_country: Property.ShortText({
            displayName: 'Country Code',
            description: 'Two-letter ISO country code (e.g., BE, NL, FR)',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Additional details about the company',
            required: false,
        }),
        language: Property.StaticDropdown({
            displayName: 'Language',
            description: 'Preferred language for communication',
            required: false,
            options: {
                options: [
                    { label: 'Dutch', value: 'nl' },
                    { label: 'English', value: 'en' },
                    { label: 'French', value: 'fr' },
                    { label: 'German', value: 'de' }
                ]
            }
        }),
    },
    async run(context) {
        const company: Record<string, any> = {
            name: context.propsValue.name,
        };

        // Add optional fields if they are provided
        if (context.propsValue.vat_number) {
            company['vat_number'] = context.propsValue.vat_number;
        }

        if (context.propsValue.national_identification_number) {
            company['national_identification_number'] = context.propsValue.national_identification_number;
        }

        if (context.propsValue.email) {
            company['emails'] = [{
                type: 'primary',
                email: context.propsValue.email
            }];
        }

        if (context.propsValue.phone) {
            company['telephones'] = [{
                type: 'phone',
                number: context.propsValue.phone
            }];
        }

        if (context.propsValue.website) {
            company['website'] = context.propsValue.website;
        }

        if (context.propsValue.description) {
            company['description'] = context.propsValue.description;
        }

        if (context.propsValue.language) {
            company['language'] = context.propsValue.language;
        }

        // Add address if provided
        if (context.propsValue.address_line_1 && context.propsValue.address_postal_code && 
            context.propsValue.address_city && context.propsValue.address_country) {
            company['addresses'] = [{
                type: 'primary',
                address: {
                    line_1: context.propsValue.address_line_1,
                    postal_code: context.propsValue.address_postal_code,
                    city: context.propsValue.address_city,
                    country: context.propsValue.address_country
                }
            }];
        }

        // Create company using Teamleader API
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/companies.add',
            body: company
        });

        return response.body;
    },
});
