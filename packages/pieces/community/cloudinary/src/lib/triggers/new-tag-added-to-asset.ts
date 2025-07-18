
import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    PiecePropValueSchema,
    Property,
    StaticPropsValue,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';


const props = {
    asset_folder: Property.ShortText({
        displayName: 'Asset Folder',
        description: 'The Cloudinary folder to watch for new resources.',
        required: true,
    }),
};

const polling: Polling<PiecePropValueSchema<typeof cloudinaryAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const resourceType = (propsValue as any).resourceType || 'image';
        const response = await makeRequest(auth, HttpMethod.GET, `/resources/${resourceType}`);
        const items = response.data.resources as any[];
        return items
            .filter(item => {
                const updatedAt = item.last_updated?.tags_updated_at || item.last_updated?.updated_at || item.created_at;
                return dayjs(updatedAt).valueOf() > (lastFetchEpochMS ?? 0);
            })
            .map(item => {
                const updatedAt = item.last_updated?.tags_updated_at || item.last_updated?.updated_at || item.created_at;
                return {
                    epochMilliSeconds: dayjs(updatedAt).valueOf(),
                    data: item,
                };
            });
    },
};

export const newTagAddedToAsset = createTrigger({
    auth: cloudinaryAuth,
    name: 'new_resource_in_folder',
    displayName: 'New Resource in Folder',
    description: 'Triggers when a new image, video, or file is uploaded to a specific folder in Cloudinary.',
    props,
    sampleData: {
        "asset_id": "d78ae88939e267ca6f3b5a352648259d",
        "public_id": "111",
        "format": "png",
        "version": 1752588559,
        "resource_type": "image",
        "type": "upload",
        "created_at": "2025-07-15T14:09:19Z",
        "bytes": 13685,
        "width": 667,
        "height": 276,
        "asset_folder": "",
        "display_name": "111",
        "url": "http://res.cloudinary.com/<cloud_name>/image/upload/v1752588559/111.png",
        "secure_url": "https://res.cloudinary.com/<cloud_name>/image/upload/v1752588559/111.png",
        "last_updated": {
            "tags_updated_at": "2025-07-15T17:37:12+00:00",
            "updated_at": "2025-07-15T17:37:12+00:00"
        }
    },
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});