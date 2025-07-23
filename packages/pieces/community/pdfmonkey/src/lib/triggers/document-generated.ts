import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<
    PiecePropValueSchema<typeof pdfmonkeyAuth>,
    Record<string, never>
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        // Fetch document cards from PDFMonkey
        const response = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/document_cards?per_page=50&sort=created_at_desc'
        );
        const documentCards = response?.document_cards || [];
        // Only include those with status 'success' and created after last fetch
        return documentCards
            .filter((doc: any) => doc.status === 'success')
            .filter((doc: any) => {
                const created = dayjs(doc.created_at).valueOf();
                return !lastFetchEpochMS || created > lastFetchEpochMS;
            })
            .map((doc: any) => ({
                epochMilliSeconds: dayjs(doc.created_at).valueOf(),
                data: doc,
            }));
    },
};

export const documentGenerated = createTrigger({
    auth: pdfmonkeyAuth,
    name: 'documentGenerated',
    displayName: 'Document Generated',
    description: 'Fires when a PDF document generation completes successfully.',
    props: {},
    sampleData: {
        id: '11475e57-0334-4ad5-8896-9462a2243957',
        app_id: 'c2b67b84-4aac-49ea-bed8-69a15d7a65d3',
        created_at: '2022-04-07T11:01:38.201+02:00',
        document_template_id: '96611e9e-ab03-4ac3-8551-1b485210c892',
        document_template_identifier: 'My Awesome Template',
        download_url:
            'https://pdfmonkey.s3.eu-west-1.amazonaws.com/production/backend/document/11475e57-0334-4ad5-8896-9462a2243957/my-test-document.pdf?...',
        failure_cause: null,
        filename: 'my-test-document.pdf',
        meta: '{ "_filename":"my-test-document.pdf" }',
        public_share_link:
            'https://files.pdfmonkey.io/share/5CEA8C37-D130-4C19-9E11-72BE2293C82B/my-test-document.pdf',
        status: 'success',
        updated_at: '2022-04-03T11:12:56.023+02:00',
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },

    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
