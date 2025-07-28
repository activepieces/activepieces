import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const updateCompany = createAction({
    name: 'update_company',
    displayName: 'Update Company',
    description: 'Update an existing company record in Teamleader',
    auth: teamleaderAuth,
    props: {
        company_id: Property.Dropdown({
            displayName: 'Company',
            description: 'The company to update',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                try {
                    const response = await teamleaderCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: '/companies.list'
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((company: any) => ({
                            label: company.name,
                            value: company.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading companies'
                    };
                }
            }
        }),
        name: Property.ShortText({
            displayName: 'Company Name',
            description: 'Name of the company',
            required: false,
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
        const updateData: Record<string, any> = {
            id: context.propsValue.company_id
        };

        // Add fields that are provided
        if (context.propsValue.name) {
            updateData['name'] = context.propsValue.name;
        }

        if (context.propsValue.vat_number) {
            updateData['vat_number'] = context.propsValue.vat_number;
        }

        if (context.propsValue.national_identification_number) {
            updateData['national_identification_number'] = context.propsValue.national_identification_number;
        }

        if (context.propsValue.email) {
            updateData['emails'] = [{
                type: 'primary',
                email: context.propsValue.email
            }];
        }

        if (context.propsValue.phone) {
            updateData['telephones'] = [{
                type: 'phone',
                number: context.propsValue.phone
            }];
        }

        if (context.propsValue.website) {
            updateData['website'] = context.propsValue.website;
        }

        if (context.propsValue.description) {
            updateData['description'] = context.propsValue.description;
        }

        if (context.propsValue.language) {
            updateData['language'] = context.propsValue.language;
        }

        // Add address if provided
        if (context.propsValue.address_line_1 && context.propsValue.address_postal_code && 
            context.propsValue.address_city && context.propsValue.address_country) {
            updateData['addresses'] = [{
                type: 'primary',
                address: {
                    line_1: context.propsValue.address_line_1,
                    postal_code: context.propsValue.address_postal_code,
                    city: context.propsValue.address_city,
                    country: context.propsValue.address_country
                }
            }];
        }

        // Update company using Teamleader API
        await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/companies.update',
            body: updateData
        });

        // Get and return the updated company data
        const updatedCompany = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/companies.info',
            queryParams: {
                id: context.propsValue.company_id
            }
        });

        return updatedCompany.body;
    },
});
