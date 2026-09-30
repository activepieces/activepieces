import { createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { listBucketsActionOutputSchema } from '../output-schemas';

export const listBuckets = createAction({
    name: 'list_buckets',
    classification: 'READ',
    displayName: 'List Storage Buckets',
    description: 'Lists all Storage buckets in the project.',
    audience: 'both',
    aiMetadata: {
        description: 'Lists every Storage bucket in the connected Supabase project, with each bucket\'s visibility (public/private) and file size limit. Use to discover which buckets exist before uploading, listing, or downloading files. Read-only and idempotent.',
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {},
    outputSchema: listBucketsActionOutputSchema,
    async run(context) {
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            throw new Error(`Failed to list buckets: ${error.message}`);
        }

        return {
            buckets: (data ?? []).map((bucket) => ({
                id: bucket.id,
                name: bucket.name,
                public: bucket.public,
                created_at: bucket.created_at,
                updated_at: bucket.updated_at,
            })),
        };
    },
});
