import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { deleteFileActionOutputSchema } from '../output-schemas';

export const deleteFile = createAction({
    name: 'delete_file',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Files',
    description: 'Permanently deletes one or more files from a Storage bucket.',
    audience: 'both',
    aiMetadata: {
        description: 'Permanently deletes one or more files from a Storage bucket, given their full paths. Use only once you have confirmed the paths (List Files in Bucket first). Idempotent: re-running on paths that no longer exist deletes nothing further.',
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
        paths: Property.Array({
            displayName: 'File Paths',
            description: 'One path per entry, like folder/report.pdf.',
            required: true,
        }),
    },
    outputSchema: deleteFileActionOutputSchema,
    async run(context) {
        const { bucket, paths } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.storage.from(bucket).remove(paths as string[]);

        if (error) {
            throw new Error(`Failed to delete file(s): ${error.message}`);
        }

        return {
            deleted_files: (data ?? []).map((file) => ({
                name: file.name,
            })),
        };
    },
});
