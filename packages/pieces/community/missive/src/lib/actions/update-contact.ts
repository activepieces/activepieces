import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';

export const updateContact = createAction({
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Modify fields for an existing contact by ID',
    auth: missiveAuth,
    props: {
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to update',
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the contact',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the contact',
            required: false,
        }),
        middle_name: Property.ShortText({
            displayName: 'Middle Name',
            description: 'Middle name of the contact',
            required: false,
        }),
        phonetic_first_name: Property.ShortText({
            displayName: 'Phonetic First Name',
            description: 'Phonetic spelling of the first name',
            required: false,
        }),
        phonetic_last_name: Property.ShortText({
            displayName: 'Phonetic Last Name',
            description: 'Phonetic spelling of the last name',
            required: false,
        }),
        phonetic_middle_name: Property.ShortText({
            displayName: 'Phonetic Middle Name',
            description: 'Phonetic spelling of the middle name',
            required: false,
        }),
        prefix: Property.ShortText({
            displayName: 'Prefix',
            description: 'Name prefix (e.g., Mr., Mrs., Dr.)',
            required: false,
        }),
        suffix: Property.ShortText({
            displayName: 'Suffix',
            description: 'Name suffix (e.g., Jr., Sr., III)',
            required: false,
        }),
        nickname: Property.ShortText({
            displayName: 'Nickname',
            description: 'Nickname for the contact',
            required: false,
        }),
        file_as: Property.ShortText({
            displayName: 'File As',
            description: 'How the contact should be filed/sorted',
            required: false,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Additional notes about the contact',
            required: false,
        }),
        starred: Property.Checkbox({
            displayName: 'Starred',
            description: 'Whether the contact should be starred',
            required: false,
        }),
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            description: 'Gender of the contact',
            required: false,
            options: {
                options: [
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                    { label: 'Other', value: 'Other' }
                ]
            }
        }),
        infos: Property.Array({
            displayName: 'Contact Information',
            description: 'Email addresses, phone numbers, and other contact information',
            required: false,
            properties: {
                kind: Property.StaticDropdown({
                    displayName: 'Type',
                    description: 'Type of contact information',
                    required: true,
                    options: {
                        options: [
                            { label: 'Email', value: 'email' },
                            { label: 'Phone Number', value: 'phone_number' },
                            { label: 'Twitter', value: 'twitter' },
                            { label: 'Facebook', value: 'facebook' },
                            { label: 'Physical Address', value: 'physical_address' },
                            { label: 'URL', value: 'url' },
                            { label: 'Custom', value: 'custom' }
                        ]
                    }
                }),
                label: Property.ShortText({
                    displayName: 'Label',
                    description: 'Label for this contact information (e.g., work, home, mobile)',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'The actual contact information value',
                    required: true,
                })
            }
        }),
        memberships: Property.Array({
            displayName: 'Memberships',
            description: 'Organizations and groups the contact belongs to',
            required: false,
            properties: {
                title: Property.ShortText({
                    displayName: 'Title',
                    description: 'Job title or role',
                    required: false,
                }),
                location: Property.ShortText({
                    displayName: 'Location',
                    description: 'Location or office',
                    required: false,
                }),
                group_kind: Property.StaticDropdown({
                    displayName: 'Group Type',
                    description: 'Type of group',
                    required: true,
                    options: {
                        options: [
                            { label: 'Organization', value: 'organization' },
                            { label: 'Group', value: 'group' }
                        ]
                    }
                }),
                group_name: Property.ShortText({
                    displayName: 'Group Name',
                    description: 'Name of the organization or group',
                    required: true,
                })
            }
        })
    },
    async run(context) {
        const { 
            contact_id,
            first_name, 
            last_name, 
            middle_name,
            phonetic_first_name,
            phonetic_last_name,
            phonetic_middle_name,
            prefix,
            suffix,
            nickname,
            file_as,
            notes,
            starred,
            gender,
            infos,
            memberships
        } = context.propsValue;

        const contactData: Record<string, any> = {};

        if (first_name) contactData['first_name'] = first_name;
        if (last_name) contactData['last_name'] = last_name;
        if (middle_name) contactData['middle_name'] = middle_name;
        if (phonetic_first_name) contactData['phonetic_first_name'] = phonetic_first_name;
        if (phonetic_last_name) contactData['phonetic_last_name'] = phonetic_last_name;
        if (phonetic_middle_name) contactData['phonetic_middle_name'] = phonetic_middle_name;
        if (prefix) contactData['prefix'] = prefix;
        if (suffix) contactData['suffix'] = suffix;
        if (nickname) contactData['nickname'] = nickname;
        if (file_as) contactData['file_as'] = file_as;
        if (notes) contactData['notes'] = notes;
        if (starred !== undefined) contactData['starred'] = starred;
        if (gender) contactData['gender'] = gender;

        if (infos && infos.length > 0) {
            contactData['infos'] = infos.map((info: any) => ({
                kind: info.kind,
                label: info.label,
                value: info.value
            }));
        }

        if (memberships && memberships.length > 0) {
            contactData['memberships'] = memberships.map((membership: any) => ({
                title: membership.title,
                location: membership.location,
                group: {
                    kind: membership.group_kind,
                    name: membership.group_name
                }
            }));
        }

        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/contacts/${contact_id}`,
            body: {
                contacts: [contactData]
            },
        });

        return response.body;
    },
}); 