import {
    createTrigger,
    TriggerStrategy,
    Property,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { evernoteCommon } from '../common/common';

const { auth } = evernoteCommon;

type TriggerProps = {
    tagGuid: string;
};

const polling: Polling<string, TriggerProps> = {
    // We use the note's 'updated' timestamp for deduplication.
    // Adding a tag updates the note, so this works reliably.
    strategy: DedupeStrategy.TIMEBASED, 
    async items({ auth, propsValue, lastFetchEpochMS }) {
        const { tagGuid } = propsValue;

        // The simple search API needs the tag's name, not its GUID.
        // So, first we fetch the tag's details to get its name.
        const tagResponse = await httpClient.sendRequest<{ name: string }>({
            method: HttpMethod.GET,
            url: `https://www.evernote.com/api/v1/tags/${tagGuid}`,
            headers: { Authorization: `Bearer ${auth}` },
        });

        if (tagResponse.status !== 200) {
            // If the tag is not found, return no new items.
            return [];
        }
        const tagName = tagResponse.body.name;
        
        // Now, search for all notes with that tag, sorted by most recently updated.
        const notesResponse = await httpClient.sendRequest<
            { updated: number; [key: string]: unknown }[]
        >({
            method: HttpMethod.GET,
            url: `https://www.evernote.com/api/v1/notes`,
            headers: { Authorization: `Bearer ${auth}` },
            queryParams: {
                // Use Evernote's search grammar to find notes by tag name.
                words: `tag:"${tagName}"`,
                order: 'desc',
                sort_by: 'updated',
            },
        });

        // Filter the results to find notes updated since our last check.
        const updatedNotes = notesResponse.body.filter(
            (note) => note.updated > lastFetchEpochMS
        );

        // Format the notes for the polling helper.
        return updatedNotes.map((note) => ({
            epochMilliSeconds: note.updated,
            data: note,
        }));
    },
};

export const newTagAddedToNoteTrigger = createTrigger({
    name: 'new_tag_added_to_note',
    displayName: 'New Tag Added to Note',
    description: 'When a note is tagged, publish it to your CMS queue.',
    auth: auth,
    props: {
        tagGuid: Property.Dropdown({
            displayName: 'Tag to Watch',
            description: 'Select the tag that will trigger this workflow when added to a note.',
            required: true,
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
    type: TriggerStrategy.POLLING,
    
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    sampleData: {
        "guid": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "title": "Note to be Published",
        "notebookGuid": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
        "tagGuids": ["guid-of-the-watched-tag"],
        "created": 1678886400000,
        "updated": 1678887400000,
        "active": true
    },
});