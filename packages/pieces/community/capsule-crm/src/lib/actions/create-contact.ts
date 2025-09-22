import { createAction, Property, StaticPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { organisationDropdown } from '../common/props';
import { CreatePartyParams } from '../common/types';

export const createContact = createAction({
    auth: capsuleCrmAuth,
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new Person or Organisation.',
    props: {
        // The spread operator correctly unpacks the object returned by Property.DynamicProperties.
        ...Property.DynamicProperties({
            displayName: 'Additional Fields',
            required: true,
            refreshers: ['type'],
            props: async (context) => {
                const propsValue = context.propsValue;
                const dynamicProps: Record<string, any> = {};

                // Define the 'type' property here as the controlling property
                dynamicProps['type'] = Property.StaticDropdown({
                    displayName: 'Contact Type',
                    description: 'The type of contact to create.',
                    required: true,
                    options: {
                        options: [
                            { label: 'Person', value: 'person' },
                            { label: 'Organisation', value: 'organisation' },
                        ]
                    }
                });

                const type = propsValue['type'] as 'person' | 'organisation';

                if (type === 'person') {
                    dynamicProps['firstName'] = Property.ShortText({
                        displayName: 'First Name',
                        description: "Set the contact's first name.",
                        required: false,
                    });
                    dynamicProps['lastName'] = Property.ShortText({
                        displayName: 'Last Name',
                        description: "Set the contact's last name (required for 'Person').",
                        required: true,
                    });
                    dynamicProps['jobTitle'] = Property.ShortText({
                        displayName: 'Job Title',
                        description: "Set the contact's job title.",
                        required: false,
                    });
                    dynamicProps['organisationId'] = organisationDropdown;
                } else if (type === 'organisation') {
                    dynamicProps['name'] = Property.ShortText({
                        displayName: 'Organisation Name',
                        description: "The name of the organisation (required for 'Organisation').",
                        required: true,
                    });
                }

                dynamicProps['about'] = Property.LongText({
                    displayName: 'About',
                    description: 'A description for the contact.',
                    required: false,
                });
                dynamicProps['email'] = Property.ShortText({
                    displayName: 'Email Address',
                    description: "The contact's primary email address.",
                    required: false,
                });
                dynamicProps['phone'] = Property.ShortText({
                    displayName: 'Phone Number',
                    description: "The contact's primary phone number.",
                    required: false,
                });
                dynamicProps['website'] = Property.ShortText({
                    displayName: 'Website URL',
                    description: "The contact's website URL.",
                    required: false,
                });
                
                return dynamicProps;
            }
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;

        const partyPayload: CreatePartyParams = {
            type: propsValue['type'] as 'person' | 'organisation',
            about: propsValue['about'] as string,
        };

        if (propsValue['type'] === 'person') {
            partyPayload.firstName = propsValue['firstName'] as string;
            partyPayload.lastName = propsValue['lastName'] as string;
            partyPayload.jobTitle = propsValue['jobTitle'] as string;
            if (propsValue['organisationId']) {
                partyPayload.organisationId = propsValue['organisationId'] as number;
            }
        } else if (propsValue['type'] === 'organisation') {
            partyPayload.name = propsValue['name'] as string;
        }

        if (propsValue['email']) {
            partyPayload.emailAddresses = [{ type: 'Work', address: propsValue['email'] as string }];
        }
        if (propsValue['phone']) {
            partyPayload.phoneNumbers = [{ number: propsValue['phone'] as string }];
        }
        if (propsValue['website']) {
            partyPayload.websites = [{ service: 'URL', address: propsValue['website'] as string }];
        }

        const response = await makeRequest(
            auth,
            HttpMethod.POST,
            '/parties',
            { party: partyPayload }
        );

        return response;
    },
});