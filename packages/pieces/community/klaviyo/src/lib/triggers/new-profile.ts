
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, Record<string, unknown>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        // Fetch profiles created after the last fetch time
        const since = lastFetchEpochMS ? new Date(lastFetchEpochMS).toISOString() : undefined;
        const path = '/profiles';
        // if (since) {
        //     path += `&filter=greater(created,${since})`;
        // }
        const api_key = auth as string;
        const response = await makeRequest(api_key as string, HttpMethod.GET, path);
        const items = response.data || [];
        return items.map((item: any) => ({
            epochMilliSeconds: dayjs(item.attributes.created).valueOf(),
            data: item,
        }));
    }
};


export const newProfileTrigger = createTrigger({
    auth: klaviyoAuth,
    name: 'newProfile',
    displayName: 'New Profile',
    description: 'Triggers when a new profile is created in the account.',
    props: {},
    sampleData: {
        type: "profile",
        id: "01JZTTZ2NNC8ZCP45SM4J84RG2",
        attributes: {
            email: "sarah.mason@klaviyo-demo.com",
            phone_number: "+15005550006",
            external_id: null,
            anonymous_id: null,
            first_name: "Sarah",
            last_name: null,
            organization: null,
            locale: null,
            title: "Regional Manager",
            image: null,
            created: "2025-07-10T18:53:32+00:00",
            updated: "2025-07-10T18:53:32+00:00",
            last_event_date: null,
            location: {
                zip: null,
                country: null,
                address1: null,
                address2: null,
                city: null,
                latitude: null,
                region: null,
                longitude: null,
                timezone: null,
                ip: null
            },
            properties: {
                "$phone_number_region": "IN"
            }
        },
        relationships: {
            lists: {
                links: {
                    self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/relationships/lists/",
                    related: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/lists/"
                }
            },
            segments: {
                links: {
                    self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/relationships/segments/",
                    related: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/segments/"
                }
            },
            "push-tokens": {
                links: {
                    self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/relationships/push-tokens/",
                    related: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/push-tokens/"
                }
            },
            conversation: {
                links: {
                    self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/relationships/conversation/",
                    related: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/conversation/"
                }
            }
        },
        links: {
            self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/"
        }
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
});