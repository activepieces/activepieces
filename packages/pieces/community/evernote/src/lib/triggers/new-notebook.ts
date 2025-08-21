import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { evernoteCommon } from '../common/common';

const { auth } = evernoteCommon;

const polling: Polling<string, Record<string,never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {

        const response = await httpClient.sendRequest<
            { serviceCreated: number; [key: string]: unknown }[]
        >({
            method: HttpMethod.GET,
            url: `https://www.evernote.com/api/v1/notebooks`,
            headers: {
                Authorization: `Bearer ${auth}`,
            },
        });

        const newNotebooks = response.body.filter(
            (notebook) => notebook.serviceCreated > lastFetchEpochMS
        );

        return newNotebooks.map((notebook) => ({
            epochMilliSeconds: notebook.serviceCreated,
            data: notebook,
        }));
    },
};

export const newNotebookTrigger = createTrigger({
    name: 'new_notebook',
    displayName: 'New Notebook',
    description: 'When someone creates a project notebook, spin up a matching project folder elsewhere.',
    auth: auth,
    props: {},
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
        "name": "New Project Notebook",
        "updateSequenceNum": 123,
        "defaultNotebook": false,
        "serviceCreated": 1678886400000,
        "serviceUpdated": 1678886400000,
        "publishing": null,
        "published": false,
        "stack": "Projects",
        "sharedNotebookIds": [],
        "sharedNotebooks": [],
        "businessNotebook": null,
        "contact": null,
        "restrictions": null
    },
});