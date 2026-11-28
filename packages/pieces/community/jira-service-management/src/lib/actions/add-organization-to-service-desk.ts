import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { organizationAddedOutputSchema } from '../output-schemas';

export const addOrganizationToServiceDeskAction = createAction({
	auth: jsmAuth,
	name: 'add_organization_to_service_desk',
	classification: 'WRITE',
	displayName: 'Add Organization to Service Desk',
	description: 'Lets every customer of an organization raise requests in a service desk.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add an existing Jira Service Management organization to a service desk, so all its customers can raise requests there. The organization must already exist; create it with Create Organization. Adding one that is already there changes nothing, so it is safe to retry.',
		idempotent: true,
	},
	outputSchema: organizationAddedOutputSchema,
	props: {
		serviceDeskId: jsmProps.serviceDesk(),
		organizationId: jsmProps.organization(),
	},
	async run(context) {
		const { serviceDeskId, organizationId } = context.propsValue;
		await jsmClient.request<unknown>({
			auth: jsmConnection.toProps(context.auth),
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: `/servicedesk/${encodeURIComponent(serviceDeskId)}/organization`,
			body: { organizationId: Number(organizationId) },
			experimental: true,
		});
		return { success: true, service_desk_id: serviceDeskId, organization_id: String(organizationId) };
	},
});
