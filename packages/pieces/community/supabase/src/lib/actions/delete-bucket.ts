import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { deleteBucketActionOutputSchema } from '../output-schemas';

export const deleteBucket = createAction({
    name: 'delete_bucket',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Storage Bucket',
    description: 'Permanently deletes a Storage bucket. The bucket must be empty first.',
    audience: 'both',
    aiMetadata: {
        description: 'Permanently deletes a Storage bucket by name. The bucket must already be empty (delete its files first) or the call fails. Use only once you have confirmed the bucket name and that it should be removed entirely. Idempotent: deleting an already-deleted bucket errors without further effect.',
        idempotent: true,
    },
    auth: supabaseAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Bucket Name',
            required: true,
        }),
    },
    outputSchema: deleteBucketActionOutputSchema,
    async run(context) {
        const { name } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { error } = await supabase.storage.deleteBucket(name);

        if (error) {
            throw new Error(`Failed to delete bucket: ${error.message}`);
        }

        return {
            success: true,
        };
    },
});
