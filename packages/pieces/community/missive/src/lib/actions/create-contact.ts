import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';
import { contactBookDropdown } from '../common/dynamic-dropdowns';

export const createContact = createAction({
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Add a new contact within a specified contact book',
    auth: missiveAuth,
    props: {
        contact_book: contactBookDropdown,
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
            defaultValue: false,
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
                label: Property.StaticDropdown({
                    displayName: 'Label',
                    description: 'Label for contact info. Choose based on Type: Email(home,work,personal,other) | Phone(main,mobile,home,work,fax,pager,other) | Address(work,home,other) | Social(work,personal,other) | URL(homepage,profile,blog,work,personal,other)',
                    required: true,
                    options: {
                        options: [
                            { label: 'Home', value: 'home' },
                            { label: 'Work', value: 'work' },
                            { label: 'Personal', value: 'personal' },
                            { label: 'Main', value: 'main' },
                            { label: 'Mobile', value: 'mobile' },
                            { label: 'Home Fax', value: 'home_fax' },
                            { label: 'Work Fax', value: 'work_fax' },
                            { label: 'Other Fax', value: 'other_fax' },
                            { label: 'Pager', value: 'pager' },
                            { label: 'Homepage', value: 'homepage' },
                            { label: 'Profile', value: 'profile' },
                            { label: 'Blog', value: 'blog' },
                            { label: 'Other', value: 'other' }
                        ]
                    }
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'The actual contact information value (email, phone, URL, etc.)',
                    required: false,
                }),
                custom_label: Property.ShortText({
                    displayName: 'Custom Label',
                    description: 'Custom label value (only used when label is "other")',
                    required: false,
                }),
                name: Property.ShortText({
                    displayName: 'Facebook Name',
                    description: 'Facebook user name (only for facebook type)',
                    required: false,
                }),
                street: Property.ShortText({
                    displayName: 'Street',
                    description: 'Street address (only for physical address type)',
                    required: false,
                }),
                extended_address: Property.ShortText({
                    displayName: 'Extended Address',
                    description: 'Extended address like apartment, suite (only for physical address type)',
                    required: false,
                }),
                city: Property.ShortText({
                    displayName: 'City',
                    description: 'City (only for physical address type)',
                    required: false,
                }),
                region: Property.ShortText({
                    displayName: 'Region/State',
                    description: 'Region or state (only for physical address type)',
                    required: false,
                }),
                postal_code: Property.ShortText({
                    displayName: 'Postal Code',
                    description: 'Postal code (only for physical address type)',
                    required: false,
                }),
                po_box: Property.ShortText({
                    displayName: 'PO Box',
                    description: 'PO Box (only for physical address type)',
                    required: false,
                }),
                country: Property.ShortText({
                    displayName: 'Country',
                    description: 'Country (only for physical address type)',
                    required: false,
                })
            }
        }),
        memberships: Property.DynamicProperties({
            displayName: 'Memberships',
            description: 'Organizations and groups the contact belongs to',
            required: false,
            refreshers: ['contact_book'],
            props: async ({ auth, contact_book }) => {
                if (!auth) {
                    return {
                        memberships_array: Property.Array({
                            displayName: 'Memberships',
                            description: 'Please authenticate first',
                            required: false,
                            properties: {
                                placeholder: Property.ShortText({
                                    displayName: 'Authenticate First',
                                    description: 'Please authenticate to access memberships',
                                    required: false,
                                })
                            }
                        })
                    };
                }

                let organizationOptions: Array<{ label: string; value: string }> = [];
                let contactGroupOptions: Array<{ label: string; value: string }> = [];

                try {
                    const orgsResponse = await missiveCommon.apiCall({
                        auth: auth as any as string,
                        method: HttpMethod.GET,
                        resourceUri: '/organizations',
                    });
                    
                    const organizations = orgsResponse.body?.organizations || [];
                    organizationOptions = organizations.map((org: any) => ({
                        label: org.name,
                        value: org.id,
                    }));
                } catch (error) {
                    console.error('Failed to fetch organizations:', error);
                }

                if (contact_book) {
                    try {
                        const groupsResponse = await missiveCommon.apiCall({
                            auth: auth as any as string,
                            method: HttpMethod.GET,
                            resourceUri: `/contact_groups?contact_book=${contact_book}&kind=group`,
                        });
                        
                        const contactGroups = groupsResponse.body?.contact_groups || [];
                        contactGroupOptions = contactGroups.map((group: any) => ({
                            label: group.name,
                            value: group.id,
                        }));
                    } catch (error) {
                        console.error('Failed to fetch contact groups:', error);
                    }
                }

                return {
                    memberships_array: Property.Array({
                        displayName: 'Memberships',
                        description: 'Add, remove, and manage contact memberships',
                        required: false,
                        properties: {
                            type: Property.StaticDropdown({
                                displayName: 'Type',
                                description: 'Type of membership',
                                required: true,
                                options: {
                                    options: [
                                        { label: 'Organization', value: 'organization' },
                                        { label: 'Group', value: 'group' }
                                    ]
                                }
                            }),
                            organization: Property.StaticDropdown({
                                displayName: 'Organization',
                                description: 'Select organization (only for Organization type)',
                                required: false,
                                options: {
                                    options: organizationOptions.length > 0 ? organizationOptions : [
                                        { label: 'No organizations found', value: '' }
                                    ]
                                }
                            }),
                            contact_group: Property.StaticDropdown({
                                displayName: 'Contact Group',
                                description: contact_book 
                                    ? 'Select contact group (only for Group type)' 
                                    : 'Select contact book first to see groups',
                                required: false,
                                options: {
                                    options: contactGroupOptions.length > 0 ? contactGroupOptions : [
                                        { label: contact_book ? 'No groups found' : 'Select contact book first', value: '' }
                                    ]
                                }
                            }),
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
                            department: Property.ShortText({
                                displayName: 'Department',
                                description: 'Department',
                                required: false,
                            }),
                            description: Property.ShortText({
                                displayName: 'Description',
                                description: 'Description of role or membership',
                                required: false,
                            })
                        }
                    })
                };
            },
        })
    },
    async run(context) {
        const propsValue = context.propsValue as any;
        const { 
            contact_book, 
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
            infos
        } = propsValue;

        const contactData: Record<string, any> = {
            contact_book,
        };

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

        if (infos && Array.isArray(infos) && infos.length > 0) {
            contactData['infos'] = infos.map((info: any) => {
                const infoObj: any = {
                    kind: info.kind,
                    label: info.label,
                };

                if (info.custom_label && info.label === 'other') {
                    infoObj.custom_label = info.custom_label;
                }

                if (info.kind === 'email' || info.kind === 'phone_number' || info.kind === 'twitter' || info.kind === 'url' || info.kind === 'custom') {
                    infoObj.value = info.value;
                } else if (info.kind === 'facebook') {
                    infoObj.name = info.name;
                } else if (info.kind === 'physical_address') {
                    if (info.street) infoObj.street = info.street;
                    if (info.extended_address) infoObj.extended_address = info.extended_address;
                    if (info.city) infoObj.city = info.city;
                    if (info.region) infoObj.region = info.region;
                    if (info.postal_code) infoObj.postal_code = info.postal_code;
                    if (info.po_box) infoObj.po_box = info.po_box;
                    if (info.country) infoObj.country = info.country;
                }

                return infoObj;
            });
        }

        const membershipsArray = propsValue.memberships_array;
        if (membershipsArray && Array.isArray(membershipsArray) && membershipsArray.length > 0) {
            const memberships: any[] = [];

            for (const membership of membershipsArray) {
                if (!membership.type) continue;

                const membershipObj: any = {};

                if (membership.title) membershipObj.title = membership.title;
                if (membership.location) membershipObj.location = membership.location;
                if (membership.department) membershipObj.department = membership.department;
                if (membership.description) membershipObj.description = membership.description;

                if (membership.type === 'organization' && membership.organization) {
                    membershipObj.group = {
                        kind: 'organization',
                        id: membership.organization
                    };
                } else if (membership.type === 'group' && membership.contact_group) {
                    membershipObj.group = {
                        kind: 'group',
                        id: membership.contact_group
                    };
                }

                if (membershipObj.group) {
                    memberships.push(membershipObj);
                }
            }

            if (memberships.length > 0) {
                contactData['memberships'] = memberships;
            }
        }

        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts',
            body: {
                contacts: [contactData]
            },
        });

        return response.body;
    },
});