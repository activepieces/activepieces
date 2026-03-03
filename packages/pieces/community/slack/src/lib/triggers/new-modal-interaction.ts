import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { ViewSubmissionPayload } from '../common/types';

export const newModalInteractionTrigger = createTrigger({
    auth: slackAuth,
    name: 'new-modal-interaction',
    displayName: 'New Modal Interaction',
    description: 'Triggers when a user interacts with a modal.',
    props: {
        interactionType: Property.StaticDropdown({
            displayName: 'Interaction Type',
            description: 'Select the type of modal interaction to trigger on.',
            required: true,
            defaultValue: 'view_submission',
            options: {
                disabled: false,
                options: [
                    { label: 'View Submission', value: 'view_submission' },
                    { label: 'View Closed', value: 'view_closed' },
                ],
            },
        }),
    },
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: undefined,
    onEnable: async (context) => {
        // Older OAuth2 has team_id, newer has team.id
        const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id'];
        context.app.createListeners({
            events: [context.propsValue.interactionType as string],
            identifierValue: teamId,
        });
    },
    onDisable: async (context) => {
        // Ignored
    },

    run: async (context) => {
        const body = context.payload.body as { payload: string };
        const payload = JSON.parse(body.payload) as ViewSubmissionPayload;

        const interactionType = context.propsValue.interactionType as string;
        if (payload.type !== interactionType) {
            return [];
        }

        const { token: _token, ...safePayload } = payload;
        return [safePayload];
    },
});
