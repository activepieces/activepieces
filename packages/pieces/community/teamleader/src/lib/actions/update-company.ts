import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const updateCompany = createAction({
    name: 'update_company',
    displayName: 'Update Company',
    description: 'Modify company information',
    auth: teamleaderAuth,
    props: {
        company_id: Property.Dropdown({
            displayName: 'Company',
            description: 'Select the company to update',
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
                        method: HttpMethod.POST,
                        resourceUri: '/companies.list',
                        body: {}
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
            description: 'Email addresses (replaces all existing emails)',
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
            description: 'Phone numbers (replaces all existing numbers)',
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
            description: 'Company addresses (replaces all existing addresses)',
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
            description: 'Company tags (replaces all existing tags)',
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
        const updateData: Record<string, any> = {
            id: context.propsValue.company_id,
        };

        // Add basic string fields that are provided
        if (context.propsValue.name !== undefined) updateData['name'] = context.propsValue.name;
        if (context.propsValue.business_type_id !== undefined) updateData['business_type_id'] = context.propsValue.business_type_id;
        if (context.propsValue.vat_number !== undefined) updateData['vat_number'] = context.propsValue.vat_number;
        if (context.propsValue.national_identification_number !== undefined) {
            updateData['national_identification_number'] = context.propsValue.national_identification_number;
        }
        if (context.propsValue.website !== undefined) updateData['website'] = context.propsValue.website;
        if (context.propsValue.iban !== undefined) updateData['iban'] = context.propsValue.iban;
        if (context.propsValue.bic !== undefined) updateData['bic'] = context.propsValue.bic;
        if (context.propsValue.language !== undefined) updateData['language'] = context.propsValue.language;
        if (context.propsValue.responsible_user_id !== undefined) updateData['responsible_user_id'] = context.propsValue.responsible_user_id;
        if (context.propsValue.remarks !== undefined) updateData['remarks'] = context.propsValue.remarks;
        if (context.propsValue.marketing_mails_consent !== undefined) {
            updateData['marketing_mails_consent'] = context.propsValue.marketing_mails_consent;
        }
        if (context.propsValue.preferred_currency !== undefined) updateData['preferred_currency'] = context.propsValue.preferred_currency;

        if (context.propsValue.emails !== undefined) {
            updateData['emails'] = context.propsValue.emails.map((emailObj: any) => ({
                type: emailObj.type,
                email: emailObj.email
            }));
        }

        if (context.propsValue.telephones !== undefined) {
            updateData['telephones'] = context.propsValue.telephones.map((phoneObj: any) => ({
                type: phoneObj.type,
                number: phoneObj.number
            }));
        }

        if (context.propsValue.addresses !== undefined) {
            updateData['addresses'] = context.propsValue.addresses.map((addressObj: any) => ({
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

        if (context.propsValue.tags !== undefined) {
            updateData['tags'] = context.propsValue.tags.map((tagObj: any) => tagObj.tag);
        }

        if (context.propsValue.custom_fields !== undefined) {
            updateData['custom_fields'] = context.propsValue.custom_fields.map((fieldObj: any) => ({
                id: fieldObj.id,
                value: fieldObj.value
            }));
        }

        await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/companies.update',
            body: updateData
        });

        return {
            success: true,
            message: 'Company updated successfully',
            company_id: context.propsValue.company_id
        };
    },
});
