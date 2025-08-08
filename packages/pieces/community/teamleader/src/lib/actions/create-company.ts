import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const createCompany = createAction({
    name: 'create_company',
    displayName: 'Create Company',
    description: 'Add a new company record',
    auth: teamleaderAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Company Name',
            description: 'Name of the company',
            required: true,
        }),
        country_for_business_type: Property.ShortText({
            displayName: 'Country Code',
            description: 'Two-letter country code (e.g., BE, NL, US) for business type selection',
            required: false,
        }),
        business_type_id: Property.Dropdown({
            displayName: 'Business Type',
            description: 'Legal structure of the company',
            required: false,
            refreshers: ['country_for_business_type'],
            options: async ({ auth, country_for_business_type }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                if (!country_for_business_type) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please select a country first'
                };

                try {
                    const response = await teamleaderCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.POST,
                        resourceUri: '/businessTypes.list',
                        body: {
                            country: country_for_business_type
                        }
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((businessType: any) => ({
                            label: businessType.name,
                            value: businessType.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading business types'
                    };
                }
            }
        }),
        vat_number: Property.ShortText({
            displayName: 'VAT Number',
            description: 'VAT/tax identification number',
            required: false,
        }),
        national_identification_number: Property.ShortText({
            displayName: 'National ID Number',
            description: 'National identification number',
            required: false,
        }),
        emails: Property.Array({
            displayName: 'Emails',
            description: 'Email addresses for the company',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Primary', value: 'primary' },
                            { label: 'Invoicing', value: 'invoicing' }
                        ]
                    }
                }),
                email: Property.ShortText({
                    displayName: 'Email Address',
                    required: true,
                })
            }
        }),
        telephones: Property.Array({
            displayName: 'Phone Numbers',
            description: 'Phone numbers for the company',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Phone', value: 'phone' },
                            { label: 'Fax', value: 'fax' }
                        ]
                    }
                }),
                number: Property.ShortText({
                    displayName: 'Phone Number',
                    required: true,
                })
            }
        }),
        website: Property.ShortText({
            displayName: 'Website',
            description: 'Company website URL',
            required: false,
        }),
        addresses: Property.Array({
            displayName: 'Addresses',
            description: 'Company addresses',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Address Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Primary', value: 'primary' },
                            { label: 'Invoicing', value: 'invoicing' },
                            { label: 'Delivery', value: 'delivery' },
                            { label: 'Visiting', value: 'visiting' }
                        ]
                    }
                }),
                line_1: Property.ShortText({
                    displayName: 'Address Line 1',
                    required: true,
                }),
                postal_code: Property.ShortText({
                    displayName: 'Postal Code',
                    required: true,
                }),
                city: Property.ShortText({
                    displayName: 'City',
                    required: true,
                }),
                country: Property.ShortText({
                    displayName: 'Country Code',
                    description: 'Two-letter country code (e.g., BE, US, NL)',
                    required: true,
                }),
                area_level_two_id: Property.ShortText({
                    displayName: 'Area Level Two ID',
                    description: 'Optional area identifier',
                    required: false,
                }),
                addressee: Property.ShortText({
                    displayName: 'Addressee',
                    description: 'Name/company for this address',
                    required: false,
                })
            }
        }),
        iban: Property.ShortText({
            displayName: 'IBAN',
            description: 'International Bank Account Number',
            required: false,
        }),
        bic: Property.ShortText({
            displayName: 'BIC',
            description: 'Bank Identifier Code',
            required: false,
        }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'Language code (e.g., en, nl, fr)',
            required: false,
        }),
        responsible_user_id: Property.ShortText({
            displayName: 'Responsible User ID',
            description: 'ID of the user responsible for this company',
            required: false,
        }),
        remarks: Property.LongText({
            displayName: 'Remarks',
            description: 'Additional notes (supports Markdown)',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Company tags',
            required: false,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag',
                    required: true,
                })
            }
        }),
        custom_fields: Property.Array({
            displayName: 'Custom Fields',
            description: 'Custom field values',
            required: false,
            properties: {
                id: Property.ShortText({
                    displayName: 'Field ID',
                    description: 'Custom field identifier',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'Field value (string, number, or boolean)',
                    required: true,
                })
            }
        }),
        marketing_mails_consent: Property.Checkbox({
            displayName: 'Marketing Consent',
            description: 'Allow marketing emails',
            required: false,
        }),
        preferred_currency: Property.StaticDropdown({
            displayName: 'Preferred Currency',
            description: 'Preferred currency for this company',
            required: false,
            options: {
                options: [
                    { label: 'Euro (EUR)', value: 'EUR' },
                    { label: 'US Dollar (USD)', value: 'USD' },
                    { label: 'British Pound (GBP)', value: 'GBP' },
                    { label: 'Canadian Dollar (CAD)', value: 'CAD' },
                    { label: 'Swiss Franc (CHF)', value: 'CHF' },
                    { label: 'Danish Krone (DKK)', value: 'DKK' },
                    { label: 'Norwegian Krone (NOK)', value: 'NOK' },
                    { label: 'Swedish Krona (SEK)', value: 'SEK' },
                    { label: 'Japanese Yen (JPY)', value: 'JPY' },
                    { label: 'Chinese Yuan (CNY)', value: 'CNY' },
                    { label: 'Czech Koruna (CZK)', value: 'CZK' },
                    { label: 'Polish Zloty (PLN)', value: 'PLN' },
                    { label: 'Romanian Leu (RON)', value: 'RON' },
                    { label: 'Turkish Lira (TRY)', value: 'TRY' },
                    { label: 'South African Rand (ZAR)', value: 'ZAR' },
                    { label: 'Indian Rupee (INR)', value: 'INR' },
                    { label: 'Mexican Peso (MXN)', value: 'MXN' },
                    { label: 'Chilean Peso (CLP)', value: 'CLP' },
                    { label: 'Colombian Peso (COP)', value: 'COP' },
                    { label: 'Peruvian Sol (PEN)', value: 'PEN' },
                    { label: 'Moroccan Dirham (MAD)', value: 'MAD' },
                    { label: 'Icelandic Krona (ISK)', value: 'ISK' },
                    { label: 'Bosnia and Herzegovina Mark (BAM)', value: 'BAM' }
                ]
            }
        }),
    },
    async run(context) {
        const company: Record<string, any> = {
            name: context.propsValue.name,
        };

        if (context.propsValue.business_type_id) company['business_type_id'] = context.propsValue.business_type_id;
        if (context.propsValue.vat_number) company['vat_number'] = context.propsValue.vat_number;
        if (context.propsValue.national_identification_number) {
            company['national_identification_number'] = context.propsValue.national_identification_number;
        }
        if (context.propsValue.website) company['website'] = context.propsValue.website;
        if (context.propsValue.iban) company['iban'] = context.propsValue.iban;
        if (context.propsValue.bic) company['bic'] = context.propsValue.bic;
        if (context.propsValue.language) company['language'] = context.propsValue.language;
        if (context.propsValue.responsible_user_id) company['responsible_user_id'] = context.propsValue.responsible_user_id;
        if (context.propsValue.remarks) company['remarks'] = context.propsValue.remarks;
        if (context.propsValue.marketing_mails_consent !== undefined) {
            company['marketing_mails_consent'] = context.propsValue.marketing_mails_consent;
        }
        if (context.propsValue.preferred_currency) company['preferred_currency'] = context.propsValue.preferred_currency;

        if (context.propsValue.emails && context.propsValue.emails.length > 0) {
            company['emails'] = context.propsValue.emails.map((emailObj: any) => ({
                type: emailObj.type,
                email: emailObj.email
            }));
        }

        if (context.propsValue.telephones && context.propsValue.telephones.length > 0) {
            company['telephones'] = context.propsValue.telephones.map((phoneObj: any) => ({
                type: phoneObj.type,
                number: phoneObj.number
            }));
        }

        if (context.propsValue.addresses && context.propsValue.addresses.length > 0) {
            company['addresses'] = context.propsValue.addresses.map((addressObj: any) => ({
                type: addressObj.type,
                address: {
                    line_1: addressObj.line_1 || null,
                    postal_code: addressObj.postal_code || null,
                    city: addressObj.city || null,
                    country: addressObj.country,
                    ...(addressObj.area_level_two_id && { area_level_two_id: addressObj.area_level_two_id }),
                    ...(addressObj.addressee && { addressee: addressObj.addressee })
                }
            }));
        }

        if (context.propsValue.tags && context.propsValue.tags.length > 0) {
            company['tags'] = context.propsValue.tags.map((tagObj: any) => tagObj.tag);
        }

        if (context.propsValue.custom_fields && context.propsValue.custom_fields.length > 0) {
            company['custom_fields'] = context.propsValue.custom_fields.map((fieldObj: any) => ({
                id: fieldObj.id,
                value: fieldObj.value
            }));
        }

        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/companies.add',
            body: company
        });

        return response.body;
    },
});
