import { createAction, Property } from "@activepieces/pieces-framework";
import { ContentType, makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const updateContact = createAction({
    auth: frontAuth,
    name: "updateContact",
    displayName: "Update Contact",
    description: "Modify existing contact fields.",
    props: {
        contactId: Property.ShortText({
            displayName: "Contact ID",
            description: "ID of the contact.",
            required: true,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Name of the contact.",
            required: false,
        }),
        description: Property.ShortText({
            displayName: "Description",
            description: "Description of the contact.",
            required: false,
        }),
        avatar: Property.File({
            displayName: "Avatar",
            description: "Avatar of the contact.",
            required: false,
        }),
        links: Property.Array({
            displayName: "Links",
            description: "Links of the contact.",
            required: false,
            properties: {
                url: Property.ShortText({
                    displayName: "URL",
                    description: "URL of the link.",
                    required: true,
                }),
            }
        }),
        groupNames: Property.Array({
            displayName: "Group Names",
            description: "Group names of the contact.",
            required: false,
            properties: {
                name: Property.ShortText({
                    displayName: "Name",
                    description: "Name of the group.",
                    required: true,
                }),
            }
        }),
        listNames: Property.Array({
            displayName: "List Names",
            description: "List of all the contact list names the contact belongs to. It will automatically create missing groups.",
            required: false,
            properties: {
                name: Property.ShortText({
                    displayName: "Name",
                    description: "Name of the list.",
                    required: true,
                }),
            }
        }),
        customFields: Property.Object({
            displayName: "Custom Fields",
            description: "Custom fields of the contact.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(
            auth,
            HttpMethod.PATCH,
            `/contacts/${propsValue.contactId}`,
            {
                name: propsValue.name,
                description: propsValue.description,
                avatar: propsValue.avatar,
                links: propsValue.links,
                group_names: propsValue.groupNames,
                list_names: propsValue.listNames,
                custom_fields: propsValue.customFields,
            },
            propsValue.avatar ? ContentType.FORM_DATA : ContentType.JSON,
        );
    },
});
