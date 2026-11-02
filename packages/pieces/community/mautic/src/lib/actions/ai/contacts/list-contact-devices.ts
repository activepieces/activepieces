import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactDevicesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactDevicesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_devices',
	outputSchema: mauticListContactDevicesOutputSchema,
	displayName: 'List Contact Devices',
	description: 'Lists the devices of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the devices (browser, OS, device type) a contact has used; page with Start and Limit. Order By takes a column with the "d." prefix, e.g. "d.dateAdded"; a bare column name fails.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		...mauticAiProps.pageOptions,
	},
	async run(context) {
		return await mauticApi.listContactRelation({
			auth: context.auth,
			id: context.propsValue.id,
			relation: 'devices',
			query: context.propsValue,
		});
	},
});
