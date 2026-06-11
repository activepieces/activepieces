import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';
import { ViewSubmissionPayload } from '../common/types';

export const newModalInteractionTrigger = createTrigger({
    auth: slackAuth,
    name: 'new-modal-interaction',
    displayName: 'New Modal Interaction',
    description: 'Triggers when a user interacts with a modal.',
    aiMetadata: {
        description:
            'Fires when a user interacts with a Slack modal view, either submitting it (view_submission) or closing it (view_closed) depending on the selected interaction type. The event payload is the Slack interaction payload (with the auth token stripped), including the submitted view, its state values, and the acting user.',
    },
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
        const teamId = await getTeamId(context.auth as SlackAuthValue);
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
