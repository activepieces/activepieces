import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';

export const removeLabelFromEmailAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'remove_label_from_email',
    displayName: 'Remove Label from Email',
    description: 'Removes one or more labels (categories) from an email.',
    props: {
        messageId: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email from which you want to remove labels.',
            required: true,
        }),
        labels: Property.Array({
            displayName: 'Labels',
            description: 'The labels (categories) to remove from the email.',
            required: true,
        }),
    },
    async run(context) {
        const { messageId, labels } = context.propsValue;
        const labelsToRemove = labels as string[];

        if (!labelsToRemove || labelsToRemove.length === 0) {
            return {
                success: true,
                message: "No labels were provided to remove.",
            };
        }
        
        const labelsToRemoveSet = new Set(labelsToRemove);

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        try {
            // Get the existing categories on the message.
            const currentMessage: Message = await client
                .api(`/me/messages/${messageId}`)
                .select('categories')
                .get();

            const existingLabels = currentMessage.categories || [];
            if (existingLabels.length === 0) {
                // If there are no labels, there's nothing to remove.
                return currentMessage;
            }

            // Filter the existing labels, keeping only those not in the removal list.
            const newLabels = existingLabels.filter(label => !labelsToRemoveSet.has(label));
            
            // Update the message with the new, filtered list of labels.
            const updatedMessage = await client
                .api(`/me/messages/${messageId}`)
                .patch({
                    categories: newLabels,
                });
            
            return updatedMessage;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to remove labels: ${errorMessage}`);
        }
    },
});