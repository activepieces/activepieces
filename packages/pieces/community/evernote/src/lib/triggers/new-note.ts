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
    notebookGuid?: string;
};

const polling: Polling<string, TriggerProps> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, propsValue, lastFetchEpochMS }) {
        const queryParams: { [key: string]: string } = {
            order: 'desc',
        };

        if (propsValue.notebookGuid) {
            queryParams['notebookGuid'] = propsValue.notebookGuid;
        }

        const response = await httpClient.sendRequest<
            { created: number; [key: string]: unknown }[]
        >({
            method: HttpMethod.GET,
            url: `https://www.evernote.com/api/v1/notes`,
            headers: {
                Authorization: `Bearer ${auth}`,
            },
            queryParams: queryParams,
        });

        const newNotes = response.body.filter(
            (note) => note.created > lastFetchEpochMS
        );

        return newNotes.map((note) => ({
            epochMilliSeconds: note.created,
            data: note,
        }));
    },
};

export const newNoteTrigger = createTrigger({
    name: 'new_note',
    displayName: 'New Note',
    description: 'Turn new notes into tasks or tickets automatically.',
    auth: auth,
    props: {
        notebookGuid: Property.Dropdown({
            displayName: 'Notebook (Optional)',
            description: 'Limit the trigger to a specific notebook.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Please provide authentication first.', options: [] };
                }
                const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: 'https://www.evernote.com/api/v1/notebooks',
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((notebook) => ({ label: notebook.name, value: notebook.guid })),
                    };
                }
                return { disabled: true, placeholder: 'Error fetching notebooks.', options: [] };
            },
        }),
    },
    type: TriggerStrategy.POLLING,
    
    // By passing the whole 'context' object, we satisfy all type requirements
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
        "title": "My Awesome Note",
        "notebookGuid": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
        "created": 1678886400000,
        "updated": 1678886400000,
        "active": true
    },
});