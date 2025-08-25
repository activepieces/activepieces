import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const createTag = createAction({
    name: 'create_tag',
    displayName: 'Create Tag',
    description: 'Mirror labels from other systems.',
    props: {
        name: Property.ShortText({
            displayName: 'Tag Name',
            description: 'The name for the new tag. This must be unique.',
            required: true,
        }),
        parentGuid: Property.Dropdown({
            displayName: 'Parent Tag (Optional)',
            description: 'Select an existing tag to make this a nested sub-tag.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Please provide authentication first.', options: [] };
                }
                const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: 'https://www.evernote.com/api/v1/tags',
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((tag) => ({ label: tag.name, value: tag.guid })),
                    };
                }
                return { disabled: true, placeholder: 'Error fetching tags.', options: [] };
            },
        }),
    },
    async run(context) {
        const { name, parentGuid } = context.propsValue;
        const token = context.auth as string;

        const tagPayload: {
            name: string;
            parentGuid?: string;
        } = {
            name: name,
        };

        if (parentGuid) {
            tagPayload.parentGuid = parentGuid;
        }

        // Corresponds to NoteStore.createTag
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://www.evernote.com/api/v1/tags',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: tagPayload,
        });

        return response.body;
    },
});