import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmRequests } from '../common/requests';
import { jsmTransitions } from '../common/transitions';
import { requestOutputSchema } from '../output-schemas';

export const transitionRequestAction = createAction({
	auth: jsmAuth,
	name: 'transition_request',
	classification: 'WRITE',
	displayName: 'Transition Request',
	description: 'Moves a request to another status, such as resolving it.',
	audience: 'both',
	aiMetadata: {
		description:
			'Run a workflow transition on a Jira Service Management request (for example resolve, escalate or cancel) and return the request with its new status. The transition must be available from the current status, so running it a second time fails. Transitions that close the request need a resolution. An optional comment is posted to the customer after the move.',
		idempotent: false,
	},
	outputSchema: requestOutputSchema,
	propertyGroups: [
		{
			key: 'request',
			display: 'section',
			label: 'Request',
			icon: 'inbox',
			props: ['requestKey'],
		},
		{
			key: 'workflow',
			display: 'section',
			label: 'Workflow',
			icon: 'send',
			props: ['transitionId', 'resolution'],
		},
	],
	props: {
		requestKey: jsmProps.request(),
		transitionId: jsmProps.transition(),
		resolution: jsmProps.resolution(),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'A reply the customer sees, added after the transition.',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const key = context.propsValue.requestKey.trim();
		const transitions = await jsmTransitions.list({ auth, requestKey: key });
		const transition = jsmTransitions.find({ transitions, idOrName: String(context.propsValue.transitionId) });
		if (isNil(transition)) {
			const available = transitions.map((item) => item.name ?? item.id).join(', ');
			throw new Error(
				`Transition "${context.propsValue.transitionId}" is not available for ${key} in its current status. Available now: ${available.length > 0 ? available : 'none'}.`,
			);
		}
		const wantedResolution = jsmClient.asString(context.propsValue.resolution);
		const resolution = isNil(wantedResolution)
			? undefined
			: jsmTransitions.findResolution({ transition, idOrName: wantedResolution });
		if (jsmTransitions.needsResolution(transition) && isNil(resolution)) {
			const allowed = jsmTransitions.resolutionsOf(transition).map((item) => item.name ?? item.id).join(', ');
			throw new Error(
				`Transition "${transition.name ?? transition.id}" needs a resolution. Pick one in the Resolution field. Allowed: ${allowed}.`,
			);
		}
		await jsmClient.request<unknown>({
			auth,
			api: 'jira',
			method: HttpMethod.POST,
			path: `/issue/${encodeURIComponent(key)}/transitions`,
			body: {
				transition: { id: transition.id },
				...(isNil(resolution) ? {} : { fields: { resolution: { id: resolution.id } } }),
			},
		});
		const comment = jsmClient.asString(context.propsValue.comment);
		if (!isNil(comment)) {
			await jsmClient.request<unknown>({
				auth,
				api: 'servicedesk',
				method: HttpMethod.POST,
				path: `/request/${encodeURIComponent(key)}/comment`,
				body: { body: comment, public: true },
			});
		}
		return jsmRequests.get({ auth, idOrKey: key });
	},
});
