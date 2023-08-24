import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { S3 } from "@aws-sdk/client-s3";
import { amazonS3Auth } from '../..';

const polling: Polling<PiecePropValueSchema<typeof amazonS3Auth>, { folderPath?: string }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, lastItemId, propsValue }) => {
        const { accessKeyId, secretAccessKey, region, bucket } = auth;
        const s3 = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            region: region || "us-east-1"
        });

        const params: any = {
            Bucket: bucket,
            MaxKeys: 100,
            StartAfter: lastItemId
        };
        if (propsValue.folderPath) params.Prefix = `${propsValue.folderPath.endsWith('/') ? propsValue.folderPath.slice(0, -1) : propsValue.folderPath}`;

        const currentValues = (await s3.listObjectsV2(params)).Contents ?? [];
        const items = (currentValues as any[]).map((item: { Key: string }) => ({
            id: item.Key,
            data: item
        }));
        return items;
    }
};

export const newFile = createTrigger({
    auth: amazonS3Auth,
    name: 'new_file',
    displayName: 'New File',
    description: 'Trigger when a new file is uploaded.',
    props: {
        folderPath: Property.ShortText({
            displayName: 'Folder Path',
            required: false
        })
    },
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    sampleData: {
        "Key": "myfolder/100-3.png",
        "LastModified": "2023-08-04T13:51:26.000Z",
        "ETag": "\"e9f16cce12352322272525f5af65a2e\"",
        "Size": 40239,
        "StorageClass": "STANDARD"
    }
});
