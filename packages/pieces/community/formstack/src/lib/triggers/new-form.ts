
import { createTrigger, TriggerStrategy, PiecePropValueSchema, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof formStackAuth>, any> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const authentication = auth as OAuth2PropertyValue;
        const accessToken = authentication['access_token']
        // Fetch forms from Formstack
        const formsResponse = await makeRequest(
            accessToken,
            HttpMethod.GET,
            '/form.json'
        );
        // The API returns an object with a 'forms' array
        const items = formsResponse.forms || [];
        // Filter forms created after lastFetchEpochMS
        const newItems = items.filter((item: any) => {
            const created = dayjs(item.created, 'YYYY-MM-DD HH:mm:ss');
            return created.valueOf() > (lastFetchEpochMS ?? 0);
        });

        return newItems.map((item: any) => ({
            epochMilliSeconds: dayjs(item.created, 'YYYY-MM-DD HH:mm:ss').valueOf(),
            data: item,
        }));
    }
};

export const newForm = createTrigger({
    auth: formStackAuth,
    name: 'newForm',
    displayName: 'New Form',
    description: 'Triggers when a new form is created in the account.',
    props: {},
    sampleData: {
        "id": "1001",
        "name": "Test Form 1",
        "views": "100",
        "created": "2007-01-01 23:59:59",
        "updated": "2007-01-02 12:13:14",
        "submissions": 100,
        "submissions_unread": 23,
        "last_submission_id": "1111",
        "last_submission_time": "2007-01-02 23:59:59",
        "url": "https://www.formstack.com/admin/data.php?1111A",
        "data_url": "https://www.formstack.com/admin/data.php?1111B",
        "summary_url": "https://www.formstack.com/admin/data.php?1111C",
        "rss_url": "https://www.formstack.com/admin/rss.php?1111D",
        "timezone": "US/Eastern"
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