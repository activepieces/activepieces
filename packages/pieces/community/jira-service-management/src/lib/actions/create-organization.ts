import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { organizationOutputSchema } from '../output-schemas';

export const createOrganizationAction = createAction({
	auth: jsmAuth,
	name: 'create_organization',
	classification: 'WRITE',
	displayName: 'Create Organization',
	description: 'Creates an organization to group customers of the same company.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a Jira Service Management organization (a named group of customers) and optionally add it to one service desk in the same step. Each call creates another organization, even with a name that already exists, so do not retry after a success.',
		idempotent: false,
	},
	outputSchema: organizationOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			placeholder: 'Acme Inc.',
			required: true,
		}),
		serviceDeskId: jsmProps.optionalServiceDesk({
			description: 'Also adds the new organization to this service desk.',
			advanced: true,
		}),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const serviceDeskId = jsmClient.asString(context.propsValue.serviceDeskId);
		const organization = await jsmClient.request<{ id?: string; name?: string }>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: '/organization',
			body: { name: context.propsValue.name.trim() },
			experimental: true,
		});
		if (!isNil(serviceDeskId) && !isNil(organization.id)) {
			await jsmClient.request<unknown>({
				auth,
				api: 'servicedesk',
				method: HttpMethod.POST,
				path: `/servicedesk/${encodeURIComponent(serviceDeskId)}/organization`,
				body: { organizationId: Number(organization.id) },
				experimental: true,
			});
		}
		return {
			organization_id: organization.id ?? null,
			name: organization.name ?? null,
			service_desk_id: serviceDeskId ?? null,
		};
	},
});
