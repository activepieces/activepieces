import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListCallEventsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_call_events',
	displayName: 'List Call Events',
	description: 'Lists the commands and webhooks recorded for calls.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of call events: the commands sent to calls and the webhooks Telnyx produced (e.g. call.answered, call.gather.ended with the collected digits in metadata, call.hangup). Filter by Call Leg ID from Dial Call to follow one call. Recent events may take a few seconds to appear.',
		idempotent: true,
	},
	props: {
		legId: Property.ShortText({
			displayName: 'Call Leg ID',
			description: 'Only events for this call_leg_id (returned by Dial Call and Get Call Status).',
			required: false,
		}),
		applicationSessionId: Property.ShortText({
			displayName: 'Call Session ID',
			description: 'Only events for this call_session_id.',
			required: false,
		}),
		connectionId: telnyxAiProps.connectionId({
			required: false,
			description: 'Only events for this connection (call control application) ID.',
		}),
		name: Property.ShortText({
			displayName: 'Event Name',
			description: 'Only events with this name, e.g. "call.gather.ended" or "call.hangup".',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Only commands or only webhooks.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'command', value: 'command' },
					{ label: 'webhook', value: 'webhook' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only events of calls in this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'init', value: 'init' },
					{ label: 'in_progress', value: 'in_progress' },
					{ label: 'completed', value: 'completed' },
				],
			},
		}),
		occurredAfter: Property.DateTime({
			displayName: 'Occurred After',
			description: 'Only events at or after this ISO 8601 time.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listCallEvents({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({
					filters: {
						leg_id: p.legId,
						application_session_id: p.applicationSessionId,
						connection_id: p.connectionId,
						name: p.name,
						type: p.type,
						status: p.status,
					},
				}),
				...telnyxUtils.toQuery({
					values: { 'filter[occurred_at][gte]': p.occurredAfter },
				}),
				...telnyxUtils.pageQuery({
					pageNumber: p.pageNumber,
					pageSize: p.pageSize,
				}),
			},
		});
	},
});
