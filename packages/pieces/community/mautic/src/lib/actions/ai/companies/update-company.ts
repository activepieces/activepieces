import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetCompanyOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateCompanyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_company',
	outputSchema: mauticGetCompanyOutputSchema,
	displayName: 'Update Company',
	description: 'Updates fields of a Mautic company.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing company. Fails if the company id does not exist. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Company Id',
			description: 'Numeric company id, from List Companies or Create Company.',
		}),
		companyname: Property.ShortText({ displayName: 'Company Name', required: false }),
		companyemail: Property.ShortText({ displayName: 'Email', required: false }),
		companyphone: Property.ShortText({ displayName: 'Phone', required: false }),
		companywebsite: Property.ShortText({ displayName: 'Website', required: false }),
		companycity: Property.ShortText({ displayName: 'City', required: false }),
		companycountry: Property.ShortText({ displayName: 'Country', required: false }),
		owner: Property.Number({
			displayName: 'Owner Id',
			description: 'Id of the Mautic user who owns the company, from List Contact Owners.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other company fields keyed by field alias, e.g. {"companyindustry": "Software", "companyaddress1": "1 Main St"}. Aliases come from List Fields with object "company". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			id,
			additionalFields,
			companyname,
			companyemail,
			companyphone,
			companywebsite,
			companycity,
			companycountry,
			owner,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'companies',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('companyname', companyname),
				...spreadIfDefined('companyemail', companyemail),
				...spreadIfDefined('companyphone', companyphone),
				...spreadIfDefined('companywebsite', companywebsite),
				...spreadIfDefined('companycity', companycity),
				...spreadIfDefined('companycountry', companycountry),
				...spreadIfDefined('owner', owner),
			},
		});
	},
});
