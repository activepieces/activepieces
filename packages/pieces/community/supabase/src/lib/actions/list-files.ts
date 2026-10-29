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

async function listAllFiles({ bucketApi, path }: ListAllFilesParams): Promise<StorageFileEntry[]> {
    const filesByName = new Map<string, StorageFileEntry>();
    let offset = 0;
    let pageLength = LIST_PAGE_SIZE;

    while (pageLength === LIST_PAGE_SIZE) {
        const { data, error } = await bucketApi.list(path, {
            limit: LIST_PAGE_SIZE,
            offset,
            sortBy: { column: 'name', order: 'asc' },
        });

        if (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }

        const page = data ?? [];
        for (const file of page) {
            if (!filesByName.has(file.name)) {
                filesByName.set(file.name, file);
            }
        }
        pageLength = page.length;
        offset += LIST_PAGE_SIZE - PAGE_OVERLAP;
    }

    return [...filesByName.values()];
}

const LIST_PAGE_SIZE = 100;

const PAGE_OVERLAP = 10;

type StorageBucketApi = ReturnType<SupabaseClient['storage']['from']>;

type StorageFileEntry = NonNullable<Awaited<ReturnType<StorageBucketApi['list']>>['data']>[number];

type ListAllFilesParams = {
    bucketApi: StorageBucketApi;
    path: string | undefined;
};
