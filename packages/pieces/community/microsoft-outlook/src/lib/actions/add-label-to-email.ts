import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';

export const addLabelToEmailAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'add_label_to_email',
    displayName: 'Add Label to Email',
    description: 'Attach one or more labels (categories) to an email.',
    props: {
        messageId: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to which you want to add labels.',
            required: true,
        }),
        labels: Property.Array({
            displayName: 'Labels',
            description: 'The labels (categories) to add to the email.',
            required: true,
        }),
    },
    async run(context) {
        const { messageId, labels } = context.propsValue;
        const newLabels = labels as string[];

        if (!newLabels || newLabels.length === 0) {
            return {
                success: true,
                message: "No labels were provided to add.",
            };
        }

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        try {
            // First, get the existing categories on the message to avoid overwriting them.
            const currentMessage: Message = await client
                .api(`/me/messages/${messageId}`)
                .select('categories')
                .get();

            const existingLabels = currentMessage.categories || [];

            // Combine existing labels with new ones, ensuring there are no duplicates.
            const combinedLabels = [...new Set([...existingLabels, ...newLabels])];

            // Update the message with the new, combined list of labels.
            const updatedMessage = await client
                .api(`/me/messages/${messageId}`)
                .patch({
                    categories: combinedLabels,
                });
            
            return updatedMessage;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to add labels: ${errorMessage}`);
        }
    },
});