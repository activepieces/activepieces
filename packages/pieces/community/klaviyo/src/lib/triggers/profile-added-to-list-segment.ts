
import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { listIdDropdown, segmentIdDropdown } from '../common/props';

const props = {
    targetType: Property.StaticDropdown({
        displayName: 'Target Type',
        description: 'Select whether to watch a List or a Segment',
        required: true,
        options: {
            options: [
                { label: 'List', value: 'list' },
                { label: 'Segment', value: 'segment' },
            ],
        },
    }),
    listId: {
        ...listIdDropdown,
        displayCondition: (props: any) => props.targetType === 'list',
    },
    segmentId: {
        ...segmentIdDropdown,
        displayCondition: (props: any) => props.targetType === 'segment',
    },
};

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {

        let path = '';
        if (propsValue.targetType === 'list') {
            path = `/lists/${propsValue.listId}/profiles?page[size]=5`;
        } else {
            path = `/segments/${propsValue.segmentId}/profiles?page[size]=5`;
            
        }
        const api_key = auth as string;
        const response = await makeRequest(api_key, HttpMethod.GET, path);
        const items = response.data || [];
        return items.map((item: any) => ({
            epochMilliSeconds: dayjs(item.attributes.joined_group_at).valueOf(),
            data: item,
        }));
    },
};

export const profileAddedToListOrSegmentTrigger = createTrigger({
    auth: klaviyoAuth,
    name: 'profile_added_to_list_or_segment',
    displayName: 'Profile Added to List or Segment',
    description: 'Triggers when a profile is added to a specific list or segment.',
    props,
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
            propsValue: context.propsValue as StaticPropsValue<typeof props>,
            files: context.files,
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue as StaticPropsValue<typeof props>,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue as StaticPropsValue<typeof props>,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            store: context.store,
            auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
            propsValue: context.propsValue as StaticPropsValue<typeof props>,
            files: context.files,
        });
    },
});