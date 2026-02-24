import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { qwilrAuth } from "../common/auth";

export const createPageAction = createAction({
    name: 'create_page',
    displayName: 'Create Page',
    description: 'Creates a new Qwilr page from saved blocks or template.',
    auth: qwilrAuth,
    props: {
        templateId: Property.ShortText({
            displayName: 'Template ID',
            description: 'ID of the template to use for the page',
            required: true
        }),
        name: Property.ShortText({
            displayName: 'Page Name',
            description: 'Title of the page, visible as the browser page title',
            required: false
        }),
        published: Property.Checkbox({
            displayName: 'Publish Page',
            description: 'Whether the page is publicly available; false means the page will be in Draft status',
            required: false,
            defaultValue: false
        }),
        ownerId: Property.ShortText({
            displayName: 'Owner ID',
            description: 'ID of the user that should own the page. If not specified, the owner of the access token will be the owner of the page.',
            required: false
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags for your page. Tags are case-sensitive.',
            required: false
        }),
        metadata: Property.Json({
            displayName: 'Metadata',
            description: 'Data you provide, that will be returned as part of all Webhooks.',
            required: false
        }),
        substitutions: Property.Json({
            displayName: 'Substitutions',
            description: 'Mapping of token API reference keys to substitution values used throughout the page.',
            required: false
        }),
        acceptSettings: Property.Object({
            displayName: 'Accept Settings',
            description: 'Configures settings for the accept block in the template being used. Only relevant if you have an accept block.',
            required: false
        })
    },
    async run(context) {
        const { templateId, name, published, ownerId, tags, metadata, substitutions, acceptSettings } = context.propsValue;
        const auth = context.auth;

        const requestBody: any = {
            templateId
        };

        if (name !== undefined) requestBody.name = name;
        if (published !== undefined) requestBody.published = published;
        if (ownerId !== undefined) requestBody.ownerId = ownerId;
        if (tags && tags.length > 0) requestBody.tags = tags;
        if (metadata !== undefined) requestBody.metadata = metadata;
        if (substitutions !== undefined) requestBody.substitutions = substitutions;
        if (acceptSettings !== undefined) requestBody.acceptSettings = acceptSettings;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.qwilr.com/v1/pages',
            headers: {
                'Authorization': `Bearer ${auth}`,
                'Content-Type': 'application/json'
            },
            body: requestBody
        });

        return response.body;
    }
});
