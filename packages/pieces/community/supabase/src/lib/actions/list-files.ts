import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
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
            description: 'The name of the Storage bucket.',
            required: true,
        }),
        path: Property.ShortText({
            displayName: 'Folder Path',
            description: 'Folder path to list within the bucket. Leave empty to list the bucket root.',
            required: false,
        }),
    },
    outputSchema: listFilesActionOutputSchema,
    async run(context) {
        const { bucket, path } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.storage.from(bucket).list(path || undefined);

        if (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }

        return {
            files: (data ?? []).map((file) => ({
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
