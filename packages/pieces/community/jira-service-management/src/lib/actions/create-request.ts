import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmRequestFields } from '../common/request-fields';
import { JsmRequest, jsmRequests } from '../common/requests';
import { jsmUsers } from '../common/users';
import { requestOutputSchema } from '../output-schemas';

export const createRequestAction = createAction({
	auth: jsmAuth,
	name: 'create_request',
	classification: 'WRITE',
	displayName: 'Create Request',
	description: 'Creates a customer request in a service desk.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a customer request in a Jira Service Management service desk with a request type and that type\'s form fields. Use for a new ticket; to reply on an existing one use Add Comment. Each call creates a new request, so a retry duplicates it.',
		idempotent: false,
	},
	outputSchema: requestOutputSchema,
	propertyGroups: [
		{
			key: 'destination',
			display: 'section',
			label: 'Where',
			icon: 'inbox',
			props: ['serviceDeskId', 'requestTypeId'],
		},
		{
			key: 'fields',
			display: 'section',
			label: 'Request Fields',
			icon: 'text',
			props: ['requestFields'],
		},
	],
	props: {
		serviceDeskId: jsmProps.serviceDesk(),
		requestTypeId: jsmProps.requestType(),
		requestFields: Property.DynamicProperties({
			auth: jsmAuth,
			displayName: 'Fields',
			required: true,
			refreshers: ['serviceDeskId', 'requestTypeId'],
			props: async ({ auth, serviceDeskId, requestTypeId }) => {
				const deskId = jsmClient.asString(serviceDeskId);
				const typeId = jsmClient.asString(requestTypeId);
				if (!auth || isNil(deskId) || isNil(typeId)) {
					return {};
				}
				return jsmRequestFields.buildProps({ auth: jsmConnection.toProps(auth), serviceDeskId: deskId, requestTypeId: typeId });
			},
		}),
		raiseOnBehalfOf: Property.ShortText({
			displayName: 'Raise on Behalf Of',
			description: 'The customer the request is for. Empty: you are the reporter.',
			placeholder: 'customer@example.com',
			required: false,
			advanced: true,
		}),
		requestParticipants: Property.Array({
			displayName: 'Participants',
			description: 'People who can also see and comment on the request.',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const { serviceDeskId, requestTypeId, raiseOnBehalfOf } = context.propsValue;
		const input = jsmClient.isRecord(context.propsValue.requestFields) ? context.propsValue.requestFields : {};
		const fields = await jsmRequestFields.list({ auth, serviceDeskId, requestTypeId });
		const requestFieldValues = await jsmRequestFields.formatValues({ auth, fields, input });
		const participants = await jsmUsers.resolveMany({
			auth,
			values: jsmUsers.toList(context.propsValue.requestParticipants),
		});
		const onBehalfOf = jsmClient.asString(raiseOnBehalfOf);
		const created = await jsmClient.request<JsmRequest>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: '/request',
			body: {
				serviceDeskId,
				requestTypeId,
				requestFieldValues,
				...(isNil(onBehalfOf) ? {} : { raiseOnBehalfOf: await jsmUsers.resolveOne({ auth, value: onBehalfOf }) }),
				...(participants.length === 0 ? {} : { requestParticipants: participants }),
			},
		});
		if (isNil(created.issueKey)) {
			return jsmRequests.flatten({ auth, request: created });
		}
		return jsmRequests.get({ auth, idOrKey: created.issueKey });
	},
});
