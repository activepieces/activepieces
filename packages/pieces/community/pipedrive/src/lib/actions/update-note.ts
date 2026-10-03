import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { updateNoteActionOutputSchema } from '../output-schemas';

export const updateNoteAction = createAction({
	auth: pipedriveAuth,
	name: 'update-note',
	outputSchema: updateNoteActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Update Note',
	description: 'Updates an existing note.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Changes an existing note: its content, the deal, lead, person or organization it is attached to, its author, or its pinned flags. Only the fields you set are sent; at least one is required. To add a new note use Create Note. Setting the same values again gives the same result, so it is safe to retry.',
		idempotent: true,
	},
	props: {
		noteId: Property.Number({
			displayName: 'Note ID',
			description: 'The numeric ID of the note to update (from Find Notes or Create Note).',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'New note content. HTML is allowed. Leave empty to keep the current content.',
			required: false,
		}),
		dealId: Property.Number({
			displayName: 'Deal ID',
			description: 'Attach the note to this deal ID (from Search Deals).',
			required: false,
		}),
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'Attach the note to this lead UUID (from Find Lead).',
			required: false,
		}),
		personId: Property.Number({
			displayName: 'Person ID',
			description: 'Attach the note to this person ID (from Search Persons).',
			required: false,
		}),
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description: 'Attach the note to this organization ID (from Search Organizations).',
			required: false,
		}),
		userId: Property.Number({
			displayName: 'Author User ID',
			description: 'Make this user ID the note author (from List Users).',
			required: false,
		}),
		pinnedToDeal: pinnedFlagProp('Pinned to Deal'),
		pinnedToLead: pinnedFlagProp('Pinned to Lead'),
		pinnedToPerson: pinnedFlagProp('Pinned to Person'),
		pinnedToOrganization: pinnedFlagProp('Pinned to Organization'),
	},
	async run(context) {
		const props = context.propsValue;
		const body: Record<string, unknown> = {
			content: pipedriveAtomic.emptyToUndefined(props.content),
			deal_id: props.dealId,
			lead_id: pipedriveAtomic.emptyToUndefined(props.leadId),
			person_id: props.personId,
			org_id: props.organizationId,
			user_id: props.userId,
			pinned_to_deal_flag: props.pinnedToDeal,
			pinned_to_lead_flag: props.pinnedToLead,
			pinned_to_person_flag: props.pinnedToPerson,
			pinned_to_organization_flag: props.pinnedToOrganization,
		};
		if (Object.values(body).every((value) => isNil(value))) {
			throw new Error('Set at least one field to update on the note.');
		}
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/v1/notes/${props.noteId}`,
			resourceLabel: `Note ${props.noteId}`,
			body,
		});
	},
});

function pinnedFlagProp(displayName: string) {
	return Property.StaticDropdown<number>({
		displayName,
		description: 'Yes to pin, No to unpin. Leave empty to keep the current setting.',
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: 1 },
				{ label: 'No', value: 0 },
			],
		},
	});
}
