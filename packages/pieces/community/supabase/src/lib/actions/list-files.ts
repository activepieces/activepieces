import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { listFilesActionOutputSchema } from '../output-schemas';

export const listFiles = createAction({
    name: 'list_files',
    classification: 'SEARCH',
    displayName: 'List Files in Bucket',
    description: 'Lists files and folders inside a Storage bucket, optionally under a specific folder path.',
    audience: 'both',
    aiMetadata: {
        description: "Lists files and folders inside a Storage bucket, optionally scoped to a folder path. Use to discover what's already stored before downloading, deleting, or generating a link for a file. Read-only and idempotent.",
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {
        bucket: Property.ShortText({
            displayName: 'Bucket',
            description: "The bucket's name, as shown in Storage.",
            placeholder: 'avatars',
            required: true,
        }),
        path: Property.ShortText({
            displayName: 'Folder Path',
            description: 'Leave empty to list the bucket root.',
            placeholder: 'folder/subfolder',
            required: false,
        }),
    },
    outputSchema: listFilesActionOutputSchema,
    async run(context) {
        const { bucket, path } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const files = await listAllFiles({
            bucketApi: supabase.storage.from(bucket),
            path: path || undefined,
            offset: 0,
        });

        return {
            files: files.map((file) => ({
                name: file.name,
                id: file.id,
                updated_at: file.updated_at,
                created_at: file.created_at,
                last_accessed_at: file.last_accessed_at,
                size: file.metadata?.['size'] ?? null,
                mimetype: file.metadata?.['mimetype'] ?? null,
            })),
        };
    },
});

async function listAllFiles({ bucketApi, path, offset }: ListAllFilesParams): Promise<StorageFileEntry[]> {
    const { data, error } = await bucketApi.list(path, { limit: LIST_PAGE_SIZE, offset });

    if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
    }

    const page = data ?? [];
    if (page.length < LIST_PAGE_SIZE) {
        return page;
    }

    const rest = await listAllFiles({ bucketApi, path, offset: offset + LIST_PAGE_SIZE });
    return [...page, ...rest];
}

const LIST_PAGE_SIZE = 100;

type StorageBucketApi = ReturnType<SupabaseClient['storage']['from']>;

type StorageFileEntry = NonNullable<Awaited<ReturnType<StorageBucketApi['list']>>['data']>[number];

type ListAllFilesParams = {
    bucketApi: StorageBucketApi;
    path: string | undefined;
    offset: number;
};
