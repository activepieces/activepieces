import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { slackAuth } from '../auth';
import { getTeamId } from '../common/auth-helpers';
import { BlockAction } from '../common/types';
import { interactivitySetupInfo, multiSelectChannelInfo, onlyBotChannels, slackChannels } from '../common/props';
import { newButtonClickTriggerOutputSchema } from '../output-schemas';

const BLOCK_ACTIONS_EVENT = 'block_actions';

export const newButtonClickTrigger = createTrigger({
    auth: slackAuth,
    name: 'new-button-click',
    classification: 'READ',
    displayName: 'New Button Click',
    description: 'Triggers when a user clicks a button in a Slack message.',
    aiMetadata: {
        description:
            'Fires when a user clicks a button in a Slack Block Kit message posted by the app (a block_actions interaction), without requiring a paused run waiting for the click. Can be filtered by exact action IDs, an action ID prefix, or specific channels. Buttons created by the Request Action / Request Approval actions are handled by those actions and never fire this trigger. The event payload is the Slack interaction payload (with the verification token stripped), including the clicked actions (action_id, block_id, value), the acting user, the channel, the original message and a response_url.',
    },
    propertyGroups: [
        {
            key: 'button_filter',
            display: 'section',
            label: 'Button',
            icon: 'tag',
            props: ['info', 'actionIds', 'actionIdPrefix'],
        },
        {
            key: 'channel_picker',
            display: 'section',
            label: 'Channel',
            icon: 'markdown',
            props: ['channelInfo', 'onlyBotChannels', 'channels'],
        },
    ],
    props: {
        info: interactivitySetupInfo,
        actionIds: Property.Array({
            displayName: 'Action IDs',
            description: 'Only fire for buttons with one of these action_id values. Empty means any button.',
            required: false,
        }),
        actionIdPrefix: Property.ShortText({
            displayName: 'Action ID Prefix',
            description: 'Only fire for buttons whose action_id starts with this text. Empty means no prefix filter.',
            required: false,
        }),
        channelInfo: multiSelectChannelInfo,
        onlyBotChannels,
        channels: { ...slackChannels, description: 'Empty means any channel or DM.' },
    },
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: {
        type: 'block_actions',
        trigger_id: '1234567890123.1234567890123.abcdef0123456789abcdef0123456789',
        api_app_id: 'A0123456789',
        response_url: 'https://hooks.slack.com/actions/T0123456789/1234567890123/abcdefABCDEF0123456789',
        team: { id: 'T0123456789', domain: 'example' },
        user: { id: 'U0123456789', username: 'jane', name: 'jane', team_id: 'T0123456789' },
        channel: { id: 'C0123456789', name: 'general' },
        container: {
            type: 'message',
            message_ts: '1700000000.000100',
            channel_id: 'C0123456789',
            is_ephemeral: false,
        },
        message: {
            type: 'message',
            ts: '1700000000.000100',
            text: 'Deploy to production?',
        },
        actions: [
            {
                type: 'button',
                action_id: 'deploy_approve',
                block_id: 'deploy_actions',
                value: 'release-42',
                text: { type: 'plain_text', text: 'Approve', emoji: true },
                style: 'primary',
                action_ts: '1700000001.000200',
            },
        ],
    },
    outputSchema: newButtonClickTriggerOutputSchema,
    onEnable: async (context) => {
        const teamId = await getTeamId(context.auth);
        context.app.createListeners({
            events: [BLOCK_ACTIONS_EVENT],
            identifierValue: teamId,
        });
    },
    onDisable: async () => undefined,

    run: async (context) => {
        const payload = parseInteractionPayload(context.payload.body);
        if (!payload || payload.type !== BLOCK_ACTIONS_EVENT || !MESSAGE_CONTAINERS.includes(payload.container?.type ?? '')) {
            return [];
        }

        const buttonActions = (payload.actions ?? []).filter((action) => action.type === 'button');
        if (buttonActions.length === 0) {
            return [];
        }

        const actionIds = toFilterList(context.propsValue.actionIds);
        const actionIdPrefix = (context.propsValue.actionIdPrefix ?? '').trim();
        const matchesFilters = (action: BlockAction) =>
            (actionIds === null || actionIds.includes(action.action_id)) &&
            (actionIdPrefix === '' || action.action_id.startsWith(actionIdPrefix));
        if (!buttonActions.some(matchesFilters)) {
            return [];
        }

        const channels = toFilterList(context.propsValue.channels);
        if (channels !== null && !channels.includes(payload.channel?.id ?? '')) {
            return [];
        }

        const { token: _token, ...safePayload } = payload;
        return [safePayload];
    },
});

const MESSAGE_CONTAINERS = ['message', 'message_attachment'];

function toFilterList(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
        return null;
    }
    const entries = value.filter((item) => !isBlank(item));
    if (entries.length === 0) {
        return null;
    }
    return entries
        .filter((item) => typeof item === 'string' || typeof item === 'number')
        .map((item) => String(item).trim());
}

function isBlank(item: unknown): boolean {
    return item === null || item === undefined || (typeof item === 'string' && item.trim() === '');
}

const blockActionsPayloadSchema = z.looseObject({
    type: z.string(),
    team: z.looseObject({ id: z.string() }).nullish(),
    user: z.looseObject({ id: z.string() }).nullish(),
    channel: z.looseObject({ id: z.string() }).nullish(),
    container: z.looseObject({ type: z.string() }).nullish(),
    actions: z.array(z.looseObject({ type: z.string(), action_id: z.string() })).optional(),
});

const interactionBodySchema = z.object({ payload: z.string() });

function parseInteractionPayload(body: unknown): BlockActionsPayloadParsed | null {
    const bodyResult = interactionBodySchema.safeParse(body);
    if (!bodyResult.success) {
        return null;
    }
    const raw = bodyResult.data.payload;
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }
    const result = blockActionsPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
}

type BlockActionsPayloadParsed = z.infer<typeof blockActionsPayloadSchema>;
