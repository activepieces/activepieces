import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateCompanyOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateCompanyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_company',
	outputSchema: mauticCreateCompanyOutputSchema,
	displayName: 'Create Company',
	description: 'Creates a Mautic company.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a company from the given field values. Company Name is required. Mautic may merge into an existing company with the same unique identifier fields.',
		idempotent: false,
	},
	props: {
		companyname: Property.ShortText({ displayName: 'Company Name', required: true }),
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
			additionalFields,
			companyname,
			companyemail,
			companyphone,
			companywebsite,
			companycity,
			companycountry,
			owner,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'companies',
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
