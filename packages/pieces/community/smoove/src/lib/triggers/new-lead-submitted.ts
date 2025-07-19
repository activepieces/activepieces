
import { createTrigger, TriggerStrategy, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { LandingPageIdDropdown } from '../common/props';



const props = {
    landingPage_id: LandingPageIdDropdown
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const response = await makeRequest(auth, HttpMethod.GET, `/LandingPages/${propsValue.landingPage_id}/Recipients?fields=id%2Cemail%2CtimestampSignup&page=1&itemsPerPage=100&includeCustomFields=false&includeLinkedLists=false`);
        const items = Array.isArray(response) ? response : [];

        const newItems = items.filter(item => {
            const createdDate = dayjs(item.timestampSignup);
            return createdDate.isValid() && createdDate.valueOf() > (lastFetchEpochMS ?? 0);
        });

        return newItems;
    }
}

export const newLeadSubmitted = createTrigger({
    auth: smooveAuth,
    name: 'newLeadSubmitted',
    displayName: 'New Lead Submitted',
    description: '',
    props,
    sampleData: {
        "id": 965381765,
        "contactId": 845986993,
        "pageUrl": "https://lp.smoove.io/wx1c?vp_aid=in85eec5&vp=eqcnb5t1gtpwra4b7grnbtne9qbfpr434b4",
        "userIP": "180.151.116.12",
        "timeStamp": "2025-07-19T18:41:48.747",
        "contact": {
            "id": 845986993,
            "externalId": "",
            "email": "sanketnannaware57@gmail.com",
            "cellPhone": "505557987678",
            "firstName": "sanket",
            "lastName": "nannaware",
            "timestampSignup": "2025-07-19T10:24:16.14"
        }
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