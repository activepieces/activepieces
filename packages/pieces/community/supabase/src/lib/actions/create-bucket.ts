import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { createBucketActionOutputSchema } from '../output-schemas';

export const createBucket = createAction({
    name: 'create_bucket',
    classification: 'WRITE',
    displayName: 'Create Storage Bucket',
    description: 'Creates a new Storage bucket, public or private.',
    audience: 'both',
    aiMetadata: {
        description: 'Creates a new Storage bucket with a given name, either public (files reachable by direct URL) or private (files require a signed URL or download). Use before uploading files to a bucket that does not exist yet. Not idempotent: creating a bucket with a name that already exists errors.',
        idempotent: false,
    },
    auth: supabaseAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Bucket Name',
            required: true,
        }),
        public: Property.Checkbox({
            displayName: 'Public',
            description: 'Whether files in this bucket are publicly readable by URL.',
            required: false,
            defaultValue: false,
        }),
        fileSizeLimit: Property.Number({
            displayName: 'File Size Limit (bytes)',
            required: false,
        }),
    },
    outputSchema: createBucketActionOutputSchema,
    async run(context) {
        const { name, public: isPublic, fileSizeLimit } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data, error } = await supabase.storage.createBucket(name, {
            public: isPublic ?? false,
            fileSizeLimit: fileSizeLimit || undefined,
        });

        if (error) {
            throw new Error(`Failed to create bucket: ${error.message}`);
        }

        return {
            name: data.name,
        };
    },
});
