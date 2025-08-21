import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealIdProp, leadIdProp, organizationIdProp, personIdProp } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createNoteAction = createAction({
	auth: pipedriveAuth,
	name: 'create-note',
	displayName: 'Create Note',
	description: 'Creates a new note.',
	props: {
		content: Property.LongText({
			displayName: 'Content',
			required: true,
		}),
		dealId: dealIdProp(false),
		pinnedToDeal: Property.Checkbox({
			displayName: 'Pin note to deal?',
			required: false,
			defaultValue: false,
		}),
		personId: personIdProp(false),
		pinnedToPerson: Property.Checkbox({
			displayName: 'Pin note to person?',
			required: false,
			defaultValue: false,
		}),
		organizationId: organizationIdProp(false),
		pinnedToOrganization: Property.Checkbox({
			displayName: 'Pin note to organization?',
			required: false,
			defaultValue: false,
		}),
		leadId: leadIdProp(false),
		pinnedToLead: Property.Checkbox({
			displayName: 'Pin note to lead?',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const {
			content,
			dealId,
			personId,
			organizationId,
			leadId,
			pinnedToDeal,
			pinnedToPerson,
			pinnedToOrganization,
			pinnedToLead,
		} = context.propsValue;

		if (!dealId && !personId && !organizationId && !leadId) {
			throw new Error(
				'Note must be associated with at least one organization, person, deal, lead or project.',
			);
		}

		const notePayload: Record<string, any> = {
			content,
			pinned_to_deal_flag: pinnedToDeal ? 1 : 0,
			pinned_to_person_flag: pinnedToPerson ? 1 : 0,
			pinned_to_organization_flag: pinnedToOrganization ? 1 : 0,
			pinned_to_lead_flag: pinnedToLead ? 1 : 0,
			lead_id: leadId,
			person_id: personId,
			org_id: organizationId,
			deal_id: dealId,
		};

		const response = await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/v1/notes',
			body: notePayload,
		});

		return response;
	},
});
