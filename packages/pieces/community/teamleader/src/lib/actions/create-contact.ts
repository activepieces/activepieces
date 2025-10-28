import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const createContact = createAction({
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new contact record',
    auth: teamleaderAuth,
    props: {
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the contact',
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the contact',
            required: true,
        }),
        salutation: Property.ShortText({
            displayName: 'Salutation',
            description: 'Salutation (e.g., Mr, Mrs, Dr)',
            required: false,
        }),
        emails: Property.Array({
            displayName: 'Emails',
            description: 'Email addresses for the contact',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Primary', value: 'primary' }
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
            description: 'Phone numbers for the contact',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Phone', value: 'phone' },
                            { label: 'Mobile', value: 'mobile' },
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
            description: 'Website URL',
            required: false,
        }),
        addresses: Property.Array({
            displayName: 'Addresses',
            description: 'Contact addresses',
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
        language: Property.ShortText({
            displayName: 'Language',
            description: 'Language code (e.g., en, nl, fr)',
            required: false,
        }),
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            description: 'Gender of the contact',
            required: false,
            options: {
                options: [
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                    { label: 'Non-binary', value: 'non_binary' },
                    { label: 'Prefers not to say', value: 'prefers_not_to_say' },
                    { label: 'Unknown', value: 'unknown' },
                ],
            },
        }),
        birthdate: Property.ShortText({
            displayName: 'Birth Date',
            description: 'Birth date (YYYY-MM-DD format)',
            required: false,
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
        national_identification_number: Property.ShortText({
            displayName: 'National ID Number',
            description: 'National identification number',
            required: false,
        }),
        remarks: Property.LongText({
            displayName: 'Remarks',
            description: 'Additional notes (supports Markdown)',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Contact tags',
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
    },
    async run(context) {
        const contact: Record<string, any> = {
            first_name: context.propsValue.first_name,
            last_name: context.propsValue.last_name,
        };

        if (context.propsValue.salutation) contact['salutation'] = context.propsValue.salutation;
        if (context.propsValue.website) contact['website'] = context.propsValue.website;
        if (context.propsValue.language) contact['language'] = context.propsValue.language;
        if (context.propsValue.gender) contact['gender'] = context.propsValue.gender;
        if (context.propsValue.birthdate) contact['birthdate'] = context.propsValue.birthdate;
        if (context.propsValue.iban) contact['iban'] = context.propsValue.iban;
        if (context.propsValue.bic) contact['bic'] = context.propsValue.bic;
        if (context.propsValue.national_identification_number) {
            contact['national_identification_number'] = context.propsValue.national_identification_number;
        }
        if (context.propsValue.remarks) contact['remarks'] = context.propsValue.remarks;
        if (context.propsValue.marketing_mails_consent !== undefined) {
            contact['marketing_mails_consent'] = context.propsValue.marketing_mails_consent;
        }

        if (context.propsValue.emails && context.propsValue.emails.length > 0) {
            contact['emails'] = context.propsValue.emails.map((emailObj: any) => ({
                type: emailObj.type,
                email: emailObj.email
            }));
        }

        if (context.propsValue.telephones && context.propsValue.telephones.length > 0) {
            contact['telephones'] = context.propsValue.telephones.map((phoneObj: any) => ({
                type: phoneObj.type,
                number: phoneObj.number
            }));
        }

        // Handle addresses array
        if (context.propsValue.addresses && context.propsValue.addresses.length > 0) {
            contact['addresses'] = context.propsValue.addresses.map((addressObj: any) => ({
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
            contact['tags'] = context.propsValue.tags.map((tagObj: any) => tagObj.tag);
        }

        if (context.propsValue.custom_fields && context.propsValue.custom_fields.length > 0) {
            contact['custom_fields'] = context.propsValue.custom_fields.map((fieldObj: any) => ({
                id: fieldObj.id,
                value: fieldObj.value
            }));
        }

        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts.add',
            body: contact
        });

        return response.body;
    },
});
