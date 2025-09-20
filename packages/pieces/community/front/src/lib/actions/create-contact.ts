import { createAction, Property } from "@activepieces/pieces-framework";
import { ContentType, makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { contactHandleSource } from "../common/dropdown";
import { frontAuth } from "../common/auth";

export const createContact = createAction({
    auth: frontAuth,
    name: "createContact",
    displayName: "Create Contact",
    description: "Create a new contact (name, email addresses, phone numbers, links, groups, picture, custom attributes).",
    props: {
        handles: Property.Array({
            displayName: "Handles",
            required: false,
            description: "List of all the handles of the contact.",
            properties: {
                handle: Property.ShortText({
                    displayName: "Handle",
                    description: "Handle used to reach the contact.",
                    required: true,
                }),
                source: contactHandleSource,
            },
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Contact name.",
            required: true,
        }),
        description: Property.ShortText({
            displayName: "Description",
            description: "Contact description.",
            required: false,
        }),
        avatar: Property.File({
            displayName: "Avatar",
            description: "Avatar of the Contact.",
            required: false,
        }),
        links: Property.Array({
            displayName: "Links",
            description: "List of all the links of the contact.",
            required: false,
            properties: {
                link: Property.ShortText({
                    displayName: "Link",
                    description: "Link URL.",
                    required: true,
                }),
            },
        }),
        listNames: Property.Array({
            displayName: "List Names",
            description: "List of all the lists of the contact.",
            required: false,
            properties: {
                listName: Property.ShortText({
                    displayName: "List Name",
                    description: "List name.",
                    required: true,
                }),
            },
        }),
        customFields: Property.Object({
            displayName: "Custom Fields",
            description: "List of all the custom fields of the contact.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        // group_names are deprecated
        return makeRequest(
            auth,
            HttpMethod.POST,
            "/contacts",
            {
                handles: propsValue.handles,
                name: propsValue.name,
                description: propsValue.description,
                avatar: propsValue.avatar,
                links: propsValue.links,
                list_names: propsValue.listNames,
                custom_fields: propsValue.customFields,
            },
            propsValue.avatar ? ContentType.FORM_DATA : ContentType.JSON
        );
    },
});
