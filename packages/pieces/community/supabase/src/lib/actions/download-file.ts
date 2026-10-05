import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { downloadFileActionOutputSchema } from '../output-schemas';

export const downloadFile = createAction({
    name: 'download_file',
    classification: 'READ',
    displayName: 'Download File',
    description: 'Downloads a file from a Storage bucket and returns its content as base64.',
    audience: 'both',
    aiMetadata: {
        description: 'Downloads a file from a Storage bucket by its path and returns its content as base64, along with its MIME type and size. Use when you need the actual file content rather than a link (for example, to read a small text/JSON file or pass an image on for processing). For large files, prefer Create Temporary File Link instead of loading the full content. Read-only and idempotent.',
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
            displayName: 'File Path',
            description: 'The path of the file within the bucket.',
            required: true,
        }),
    },
    outputSchema: downloadFileActionOutputSchema,
    async run(context) {
        const { bucket, path } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.storage.from(bucket).download(path);

        if (error) {
            throw new Error(`Failed to download file: ${error.message}`);
        }

        const arrayBuffer = await data.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
            base64,
            mimeType: data.type,
            size: data.size,
        };
    },
});
