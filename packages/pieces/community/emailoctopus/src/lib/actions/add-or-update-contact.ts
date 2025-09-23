import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpError, HttpMethod } from "@activepieces/pieces-common";
import { emailOctopusAuth } from "../common/auth";
import { emailOctopusProps } from "../common/props";


type NewField = {
    label: string;
    tag: string;
    type: 'text' | 'number' | 'date';
    fallback?: string;
}

export const addOrUpdateContact = createAction({
    auth: emailOctopusAuth,
    name: 'add_or_update_contact',
    displayName: 'Add / Update Contact',
    description: 'Adds a new contact to a list or updates an existing contact if one exists. Can also create new fields on the fly.',
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: "The contact's email address.",
            required: true,
        }),

        fields: emailOctopusProps.fields(),
        

        new_fields: Property.Array({
            displayName: 'New Fields to Create',
            description: 'Optional. Define any new fields you want to create on this list before adding the contact.',
            required: false,
            properties: {
                label: Property.ShortText({ displayName: 'Label', description: 'Human-readable name (e.g., First Name).', required: true }),
                tag: Property.ShortText({ displayName: 'Tag', description: 'Unique identifier (e.g., FirstName).', required: true }),
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Text', value: 'text' },
                            { label: 'Number', value: 'number' },
                            { label: 'Date', value: 'date' },
                        ]
                    }
                }),
                fallback: Property.ShortText({ displayName: 'Fallback', description: 'Optional default value.', required: false }),
            }
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to associate with the contact. Existing tags will not be removed.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The status of the contact.',
            required: false,
            options: {
                options: [
                    { label: 'Subscribed', value: 'subscribed' },
                    { label: 'Unsubscribed', value: 'unsubscribed' },
                    { label: 'Pending', value: 'pending' },
                ],
            },
        }),
    },

    async run(context) {
        const { list_id, email_address, fields, new_fields, tags, status } = context.propsValue;
        
        const newFieldsToCreate = new_fields as NewField[] | undefined;
        if (newFieldsToCreate && newFieldsToCreate.length > 0) {
            console.log(`Attempting to create ${newFieldsToCreate.length} new fields.`);
            const createFieldPromises = newFieldsToCreate.map(field => {
                return httpClient.sendRequest({
                    method: HttpMethod.POST,
                    url: `https://api.emailoctopus.com/lists/${list_id}/fields`,
                    body: field,
                    authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth },
                }).catch(error => {
                    if (error instanceof HttpError && error.response.status === 409) {
                        console.log(`Field with tag '${field.tag}' already exists. Skipping.`);
                        return;
                    }
                    throw error;
                });
            });
            await Promise.all(createFieldPromises);
        }

        const body: Record<string, unknown> = {
            email_address: email_address,
        };

        if (fields) {
            body['fields'] = Object.fromEntries(
                Object.entries(fields).filter(([, value]) => value !== null && value !== undefined && value !== '')
            );
        }
        if (status) {
            body['status'] = status;
        }
        const validTags = (tags as string[] | undefined)?.filter(tag => tag && tag.trim().length > 0);
        if (validTags && validTags.length > 0) {
            body['tags'] = Object.fromEntries(
                validTags.map(tag => [tag.trim(), true])
            );
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.emailoctopus.com/lists/${list_id}/contacts`,
            body: body,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth },
        });

        return response.body;
    },
});