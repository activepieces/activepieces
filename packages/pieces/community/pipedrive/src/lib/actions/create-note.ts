import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealIdProp, leadIdProp, organizationIdProp, personIdProp } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createNoteAction = createAction({
    auth: pipedriveAuth,
    name: 'create-note',
    displayName: 'Create Note',
    description: 'Creates a new note using Pipedrive API v2.', // ✅ Updated description for v2
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

        // Pipedrive v2 requires a note to be associated with at least one entity.
        if (!dealId && !personId && !organizationId && !leadId) {
            throw new Error("Note must be associated with at least one organization, person, deal, or lead.");
        }

        const notePayload: Record<string, any> = {
            content,
            // ✅ Boolean flags now directly accept true/false, not 1/0
            pinned_to_deal_flag: pinnedToDeal,
            pinned_to_person_flag: pinnedToPerson,
            pinned_to_organization_flag: pinnedToOrganization,
            pinned_to_lead_flag: pinnedToLead,
            lead_id: leadId,         // Ensure this is the correct ID type (string/number) for leads
            person_id: personId,     // Ensure this is a number (ID)
            org_id: organizationId,  // Ensure this is a number (ID)
            deal_id: dealId,         // Ensure this is a number (ID)
        };

        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/notes', // ✅ Updated to v2 endpoint
            body: notePayload,
        });

        return response;
    },
});
