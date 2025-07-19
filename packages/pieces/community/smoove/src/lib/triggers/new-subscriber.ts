
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await makeRequest(auth, HttpMethod.GET, '/Contacts');
        const items = Array.isArray(response) ? response : [];
        
        const newItems = items.filter(item => {
            const createdDate = dayjs(item.timestampSignup);
            return createdDate.isValid() && createdDate.valueOf() > (lastFetchEpochMS ?? 0);
        });
        return newItems.map(item => ({
            epochMilliSeconds: dayjs(item.timestampSignup).valueOf(),
            data: {
                id: String(item.id),
                email: item.email,
                phone: item.phone,
                cellPhone: item.cellPhone,
                firstName: item.firstName,
                lastName: item.lastName,
                address: item.address,
                city: item.city,
                country: item.country,
                company: item.company,
                position: item.position,
                canReceiveEmails: item.canReceiveEmails,
                canReceiveSmsMessages: item.canReceiveSmsMessages,
                ipSignup: item.ipSignup,
                timestampSignup: item.timestampSignup,
                lastChanged: item.lastChanged,
                deleted: item.deleted,
                joinSource: item.joinSource,
                listAssociationTime: item.listAssociationTime,
                c_DaysSinceSignup: item.c_DaysSinceSignup,
                campaignSource: item.campaignSource,
                rawSubscriberData: item,
                triggerInfo: {
                    detectedAt: new Date().toISOString(),
                    source: 'smoove',
                    type: 'new_subscriber',
                },
            },
        }));
    }
};

export const newSubscriber = createTrigger({
    auth: smooveAuth,
    name: 'newSubscriber',
    displayName: 'New Subscriber',
    description: 'Triggers when a new subscriber is added to your Smoove account.',
    props: {},
    sampleData: {
        id: '845986993',
        email: 'sanketnannaware57@gmail.com',
        phone: '',
        cellPhone: '505557987678',
        firstName: 'sanket',
        lastName: 'nannaware',
        address: '',
        city: '',
        country: 'NETHERLANDS (NL), NORTH HOLLAND, AMSTERDAM',
        company: '',
        position: '',
        canReceiveEmails: true,
        canReceiveSmsMessages: true,
        ipSignup: '',
        timestampSignup: '2025-07-19T10:24:16.14',
        lastChanged: '2025-07-19T12:01:27.15',
        deleted: false,
        joinSource: 'Unknown',
        listAssociationTime: '0001-01-01T00:00:00',
        c_DaysSinceSignup: 0,
        campaignSource: '',
        triggerInfo: {
            detectedAt: new Date().toISOString(),
            source: 'smoove',
            type: 'new_subscriber',
        },
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        const response = await makeRequest(context.auth, HttpMethod.GET, '/Contacts');
        const item = Array.isArray(response) ? response[0] : null;
        if (!item) throw new Error('No subscribers found to test with');
        return [{
            id: String(item.id),
            email: item.email,
            phone: item.phone,
            cellPhone: item.cellPhone,
            firstName: item.firstName,
            lastName: item.lastName,
            address: item.address,
            city: item.city,
            country: item.country,
            company: item.company,
            position: item.position,
            canReceiveEmails: item.canReceiveEmails,
            canReceiveSmsMessages: item.canReceiveSmsMessages,
            ipSignup: item.ipSignup,
            timestampSignup: item.timestampSignup,
            lastChanged: item.lastChanged,
            deleted: item.deleted,
            joinSource: item.joinSource,
            listAssociationTime: item.listAssociationTime,
            c_DaysSinceSignup: item.c_DaysSinceSignup,
            campaignSource: item.campaignSource,
            triggerInfo: {
                detectedAt: new Date().toISOString(),
                source: 'smoove',
                type: 'new_subscriber',
            },
        }];
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});