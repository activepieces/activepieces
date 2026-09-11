import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { upsertContact } from './contacts';
import { hkVoiceApi } from '../common/client';
import { hkVoiceProps, toStringRecord } from '../common/props';

export const startOutboundCallAction = createAction({
    auth: hkVoiceAuth,
    name: 'start_outbound_call',
    classification: 'WRITE',
    displayName: 'Start Voice AI Call',
    description:
        'Places one outbound Voice AI / AI phone call. Choose agent, call flow, and from-number; pass prompt variables (e.g. guest name for “welcome again”); optionally upsert the contact first. Outcome arrives on event_webhook_url.',
    audience: 'both',
    aiMetadata: {
        description:
            'Starts one outbound Heykoala Voice AI call. Provide to_number (E.164) and/or contact_id. Pass variables for call-flow personalization (Welcome again {{name}}). Optionally ensure_contact. Paste an HK Voice AI trigger webhook URL into event_webhook_url. Each run dials again.',
        idempotent: false,
    },
    props: {
        to_number: Property.ShortText({
            displayName: 'To number',
            description:
                'Destination E.164, e.g. +919876543210. Map from Excel / Salesforce / Tables with a mention. Must exist as a Voice contact unless Ensure contact or contact_id is set.',
            required: false,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'Voice contact UUID. Required when to_number is omitted.',
            required: false,
        }),
        agent_id: hkVoiceProps.optionalAgentId,
        call_flow_id: hkVoiceProps.optionalCallFlowId,
        from_number: hkVoiceProps.optionalFromNumber,
        variables: Property.Object({
            displayName: 'Call variables',
            description:
                'Key/value map injected into the agent/call-flow prompt and echoed on every webhook as call.variables. Example: name → Jack, reservation_id → R-1024. Keys must match placeholders in the Voice call flow.',
            required: false,
        }),
        ensure_contact: Property.Checkbox({
            displayName: 'Ensure contact',
            description:
                'When on, upsert a Voice contact for to_number before dispatch (required by Voice). Uses Contact name / custom fields below, or variables.name when name is empty.',
            required: false,
            defaultValue: true,
        }),
        contact_name: Property.ShortText({
            displayName: 'Contact name',
            description: 'Used when Ensure contact is on. Falls back to variables.name.',
            required: false,
        }),
        contact_email: Property.ShortText({
            displayName: 'Contact email',
            description: 'Optional email stored on the Voice contact.',
            required: false,
        }),
        contact_custom_fields: Property.Object({
            displayName: 'Contact custom fields',
            description:
                'Stored on the contact (call.contact.custom_fields on webhooks). Separate from Call variables, which feed the prompt.',
            required: false,
        }),
        event_webhook_url: Property.ShortText({
            displayName: 'Event webhook URL',
            description:
                'HTTPS URL for call lifecycle events. Paste a Zwigly HK Voice trigger webhook URL (prefer Call Analysis Completed) to drive post-call PDF / email / CRM flows.',
            required: false,
        }),
        event_webhook_events: Property.StaticMultiSelectDropdown({
            displayName: 'Webhook events',
            description: 'Subset of events to send. Leave empty for all six.',
            required: false,
            options: {
                options: [
                    { label: 'call.started', value: 'call.started' },
                    { label: 'call.connected', value: 'call.connected' },
                    { label: 'call.ended', value: 'call.ended' },
                    { label: 'call.failed', value: 'call.failed' },
                    { label: 'call.recording_available', value: 'call.recording_available' },
                    { label: 'call.analysis_completed', value: 'call.analysis_completed' },
                ],
            },
        }),
        event_webhook_headers: Property.Object({
            displayName: 'Webhook headers',
            description:
                'Optional headers Voice sends with every delivery (e.g. Authorization → Bearer …).',
            required: false,
        }),
        knowledge_base_id: Property.ShortText({
            displayName: 'Knowledge base ID',
            required: false,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const toNumber = context.propsValue.to_number?.trim();
        let contactId = context.propsValue.contact_id?.trim();
        if (!toNumber && !contactId) {
            throw new Error('Provide to_number and/or contact_id');
        }

        const variables = toStringRecord(context.propsValue.variables);
        const ensureContact = context.propsValue.ensure_contact !== false;

        if (ensureContact && toNumber) {
            const nameFromVars = variables?.['name'] ?? variables?.['guest_name'];
            const contactName =
                context.propsValue.contact_name?.trim() || nameFromVars || undefined;
            const upserted = await upsertContact({
                connection,
                phone: toNumber,
                name: contactName,
                email: context.propsValue.contact_email?.trim() || undefined,
                customFields: toStringRecord(context.propsValue.contact_custom_fields),
            });
            const upsertedId =
                typeof upserted.contact['id'] === 'string'
                    ? upserted.contact['id']
                    : typeof upserted.contact['contact_id'] === 'string'
                      ? upserted.contact['contact_id']
                      : undefined;
            if (upsertedId && !contactId) {
                contactId = upsertedId;
            }
        }

        const fromNumber =
            typeof context.propsValue.from_number === 'string'
                ? context.propsValue.from_number.trim()
                : undefined;
        const events = context.propsValue.event_webhook_events;
        const webhookHeaders = toStringRecord(context.propsValue.event_webhook_headers);

        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.POST,
            path: hkVoiceApi.paths.dispatch,
            body: {
                ...(context.propsValue.agent_id
                    ? { agent_id: context.propsValue.agent_id }
                    : {}),
                ...(context.propsValue.call_flow_id
                    ? { call_flow_id: context.propsValue.call_flow_id }
                    : {}),
                ...(toNumber ? { to_number: toNumber } : {}),
                ...(contactId ? { contact_id: contactId } : {}),
                ...(fromNumber ? { from_number: fromNumber } : {}),
                ...(variables ? { variables } : {}),
                ...(context.propsValue.event_webhook_url
                    ? { event_webhook_url: context.propsValue.event_webhook_url }
                    : {}),
                ...(events && events.length > 0 ? { event_webhook_events: events } : {}),
                ...(webhookHeaders ? { event_webhook_headers: webhookHeaders } : {}),
                ...(context.propsValue.knowledge_base_id
                    ? { knowledge_base_id: context.propsValue.knowledge_base_id }
                    : {}),
            },
        });
        return {
            ...hkVoiceApi.flattenBody(body),
            variables: variables ?? null,
            contact_id: contactId ?? null,
        };
    },
});
