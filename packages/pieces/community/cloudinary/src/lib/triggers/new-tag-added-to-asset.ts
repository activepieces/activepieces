
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
    resource_type: Property.StaticDropdown({
        displayName: 'Resource Type',
        description: 'The type of resources to monitor for tag changes',
        required: false,
        options: {
            options: [
                { label: 'Image', value: 'image' },
                { label: 'Video', value: 'video' },
                { label: 'Raw', value: 'raw' },
            ],
        },
        defaultValue: 'image',
    }),
    asset_folder: Property.ShortText({
        displayName: 'Asset Folder',
        description: 'Optional: Watch only assets in this specific folder. Leave empty to watch all assets.',
        required: false,
    }),
};

const polling: Polling<PiecePropValueSchema<typeof cloudinaryAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const resourceType = propsValue.resource_type || 'image';
        const endpoint = `/resources/${resourceType}`;
        
        const queryParams: Record<string, string> = {};
        if (propsValue.asset_folder && propsValue.asset_folder.trim()) {
            queryParams['prefix'] = propsValue.asset_folder.trim();
        }
        
        const response = await makeRequest(auth, HttpMethod.GET, endpoint, undefined, queryParams);
        const items = response.resources || [];
        
        return items
            .filter((item: any) => {
                const tagUpdatedAt = item.last_updated?.tags_updated_at;
                if (!tagUpdatedAt) return false;
                
                const updatedTime = dayjs(tagUpdatedAt).valueOf();
                return updatedTime > (lastFetchEpochMS || 0);
            })
            .map((item: any) => {
                const tagUpdatedAt = item.last_updated?.tags_updated_at;
                return {
                    epochMilliSeconds: dayjs(tagUpdatedAt).valueOf(),
                    data: {
                        ...item,
                        trigger_type: 'tag_added',
                        tags_updated_at: tagUpdatedAt,
                    },
                };
            });
    },
};

export const newTagAddedToAsset = createTrigger({
    auth: cloudinaryAuth,
    name: 'new_tag_added_to_asset',
    displayName: 'New Tag Added to Asset',
    description: 'Triggers when a tag is added to an asset in Cloudinary.',
    props,
    sampleData: {
        "asset_id": "d78ae88939e267ca6f3b5a352648259d",
        "public_id": "sample_image",
        "format": "png",
        "version": 1752588559,
        "resource_type": "image",
        "type": "upload",
        "created_at": "2025-07-15T14:09:19Z",
        "bytes": 13685,
        "width": 667,
        "height": 276,
        "asset_folder": "",
        "display_name": "sample_image",
        "tags": ["nature", "landscape", "sunset"],
        "url": "http://res.cloudinary.com/<cloud_name>/image/upload/v1752588559/sample_image.png",
        "secure_url": "https://res.cloudinary.com/<cloud_name>/image/upload/v1752588559/sample_image.png",
        "last_updated": {
            "tags_updated_at": "2025-07-15T17:37:12+00:00",
            "updated_at": "2025-07-15T17:37:12+00:00"
        },
        "trigger_type": "tag_added",
        "tags_updated_at": "2025-07-15T17:37:12+00:00"
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