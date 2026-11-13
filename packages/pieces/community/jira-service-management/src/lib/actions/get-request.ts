import { Property, createAction } from '@activepieces/pieces-framework';
import { jsmAuth } from '../auth';
import { jsmProps } from '../common/props';
import { jsmRequests } from '../common/requests';
import { requestDetailsOutputSchema } from '../output-schemas';

export const getRequestAction = createAction({
	auth: jsmAuth,
	name: 'get_request',
	classification: 'READ',
	displayName: 'Get Request',
	description: 'Gets one customer request with its status and fields.',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetch one Jira Service Management customer request by its key (for example SD-123), with status, reporter, request type and form fields; optionally the status history, SLAs and participants. Use when you already know the key; to look for requests use Find Requests. Read-only, safe to retry.',
		idempotent: true,
	},
	outputSchema: requestDetailsOutputSchema,
	propertyGroups: [
		{
			key: 'request',
			display: 'section',
			label: 'Request',
			icon: 'inbox',
			props: ['requestKey'],
		},
	],
	props: {
		requestKey: jsmProps.request(),
		includeStatusHistory: Property.Checkbox({
			displayName: 'Include Status History',
			description: 'Adds every status the request went through.',
			required: false,
			defaultValue: false,
			advanced: true,
		}),
		includeSlas: Property.Checkbox({
			displayName: 'Include SLAs',
			description: 'Adds the SLA timers, such as time to resolution.',
			required: false,
			defaultValue: false,
			advanced: true,
		}),
		includeParticipants: Property.Checkbox({
			displayName: 'Include Participants',
			description: 'Adds the people the request is shared with.',
			required: false,
			defaultValue: false,
			advanced: true,
		}),
	},
	async run(context) {
		const { requestKey, includeStatusHistory, includeSlas, includeParticipants } = context.propsValue;
		const expand = [
			...(includeStatusHistory ? ['status'] : []),
			...(includeSlas ? ['sla'] : []),
			...(includeParticipants ? ['participant'] : []),
		];
		return jsmRequests.get({ auth: context.auth.props, idOrKey: requestKey, expand });
	},
});
