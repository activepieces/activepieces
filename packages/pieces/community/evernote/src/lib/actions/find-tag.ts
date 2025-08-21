import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const findTag = createAction({
    name: 'find_tag',
    displayName: 'Find a Tag',
    description: 'Searches for an existing tag.',
    props: {
        name: Property.ShortText({
            displayName: 'Tag Name',
            description: 'The name of the tag to find.',
            required: true,
        }),
        caseSensitive: Property.Checkbox({
            displayName: 'Case Sensitive',
            description: 'If checked, the search will be case-sensitive.',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { name, caseSensitive } = context.propsValue;
        const token = context.auth as string;

        // 1. Fetch all tags from the user's account
        const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
            method: HttpMethod.GET,
            url: 'https://www.evernote.com/api/v1/tags',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(`Failed to fetch tags. Status: ${response.status}`);
        }

        const allTags = response.body;

        // 2. Filter the tags to find the one that matches the provided name
        const foundTag = allTags.find(tag => {
            const tagName = caseSensitive ? tag.name : tag.name.toLowerCase();
            const searchName = caseSensitive ? name : name.toLowerCase();
            return tagName === searchName;
        });

        // 3. Return the found tag or null if not found
        return foundTag || null;
    },
});