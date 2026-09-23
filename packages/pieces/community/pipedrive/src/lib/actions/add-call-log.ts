import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { addCallLogActionOutputSchema } from '../output-schemas';

export const addCallLogAction = createAction({
	auth: pipedriveAuth,
	name: 'add-call-log',
	outputSchema: addCallLogActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Add Call Log',
	description: 'Logs a phone call in Pipedrive.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Logs a phone call that already happened, with outcome, numbers and start/end time. Pipedrive requires it to be linked to at least one of a person, organization, deal, lead or existing call activity, and it creates (or converts) a done call activity alongside the log. To schedule a future call use Create Activity instead. Creates a new record on every call.',
		idempotent: false,
	},
	props: {
		outcome: Property.StaticDropdown<string>({
			displayName: 'Outcome',
			description: 'How the call ended.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Connected', value: 'connected' },
					{ label: 'No Answer', value: 'no_answer' },
					{ label: 'Left Message', value: 'left_message' },
					{ label: 'Left Voicemail', value: 'left_voicemail' },
					{ label: 'Wrong Number', value: 'wrong_number' },
					{ label: 'Busy', value: 'busy' },
				],
			},
		}),
		toPhoneNumber: Property.ShortText({
			displayName: 'To Phone Number',
			description: 'The phone number that was called.',
			required: true,
		}),
		startTime: Property.DateTime({
			displayName: 'Start Time',
			description: 'When the call started. Sent to Pipedrive in UTC.',
			required: true,
		}),
		endTime: Property.DateTime({
			displayName: 'End Time',
			description: 'When the call ended. Sent to Pipedrive in UTC.',
			required: true,
		}),
		fromPhoneNumber: Property.ShortText({
			displayName: 'From Phone Number',
			description: 'The phone number the call was made from.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'A short subject for the call log.',
			required: false,
		}),
		duration: Property.Number({
			displayName: 'Duration',
			description: 'The call duration in seconds.',
			required: false,
		}),
		userId: Property.Number({
			displayName: 'User ID',
			description: 'The user the call log belongs to (from List Users). Defaults to the connected user.',
			required: false,
		}),
		activityId: Property.Number({
			displayName: 'Activity ID',
			description: 'The ID of an existing call activity to convert into this call log.',
			required: false,
		}),
		personId: Property.Number({
			displayName: 'Person ID',
			description: 'The person the call was with (from Search Persons).',
			required: false,
		}),
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description: 'The organization the call was with (from Search Organizations).',
			required: false,
		}),
		dealId: Property.Number({
			displayName: 'Deal ID',
			description:
				'The deal the call relates to (from Search Deals). Cannot be combined with Lead ID.',
			required: false,
		}),
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'The lead UUID the call relates to. Cannot be combined with Deal ID.',
			required: false,
		}),
		note: Property.LongText({
			displayName: 'Note',
			description: 'A note about the call, in HTML.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;
		const leadId = pipedriveAtomic.emptyToUndefined(props.leadId);
		const hasDeal = !isNil(props.dealId);
		if (hasDeal && leadId !== undefined) {
			throw new Error('Deal ID and Lead ID cannot both be supplied on a call log.');
		}
		const hasLink =
			hasDeal ||
			leadId !== undefined ||
			!isNil(props.personId) ||
			!isNil(props.organizationId) ||
			!isNil(props.activityId);
		if (!hasLink) {
			throw new Error(
				'Link the call log to at least one of Person ID, Organization ID, Deal ID, Lead ID or Activity ID.',
			);
		}
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/v1/callLogs',
			resourceLabel: 'call logs',
			body: {
				outcome: props.outcome,
				to_phone_number: props.toPhoneNumber,
				from_phone_number: pipedriveAtomic.emptyToUndefined(props.fromPhoneNumber),
				start_time: pipedriveAtomic.toPipedriveDateTime({
					value: props.startTime,
					label: 'Start Time',
				}),
				end_time: pipedriveAtomic.toPipedriveDateTime({ value: props.endTime, label: 'End Time' }),
				subject: pipedriveAtomic.emptyToUndefined(props.subject),
				duration: isNil(props.duration) ? undefined : String(props.duration),
				user_id: props.userId,
				activity_id: props.activityId,
				person_id: props.personId,
				org_id: props.organizationId,
				deal_id: props.dealId,
				lead_id: leadId,
				note: pipedriveAtomic.emptyToUndefined(props.note),
			},
		});
	},
});
