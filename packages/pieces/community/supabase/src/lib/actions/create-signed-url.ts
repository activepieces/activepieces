import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { createSignedUrlActionOutputSchema } from '../output-schemas';

export const createSignedUrl = createAction({
    name: 'create_signed_url',
    classification: 'READ',
    displayName: 'Create Temporary File Link',
    description: 'Generates a time-limited URL that grants temporary access to a file in a private Storage bucket.',
    audience: 'both',
    aiMetadata: {
        description: 'Generates a time-limited signed URL for a file in a Storage bucket, so it can be accessed (e.g. shared or fetched) without making the bucket public. Use for files in private buckets, or when a temporary link is preferable to returning the full file content. Read-only and idempotent: repeated calls just mint a new link with the same expiry window.',
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
        expiresIn: Property.Number({
            displayName: 'Expires In (seconds)',
            description: 'How long the link stays valid, in seconds.',
            required: false,
            defaultValue: 3600,
        }),
    },
    outputSchema: createSignedUrlActionOutputSchema,
    async run(context) {
        const { bucket, path, expiresIn } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn || 3600);

        if (error) {
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }

        return {
            signedUrl: data.signedUrl,
        };
    },
});
