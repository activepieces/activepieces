import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { companyIdProp } from '../common/props';
import { intercomClient } from '../common';

export const addOrRemoveTagOnCompanyAction = createAction({
	auth: intercomAuth,
	name: 'add-or-remove-tag-on-company',
	displayName: 'Add/Remove Tag on Company',
	description: 'Attach or remove a tag from a specific company.',
	props: {
		companyId: companyIdProp('Company ID', true),
		tagName: Property.ShortText({
			displayName: 'Tag Name',
			required: true,
		}),
		untag: Property.Checkbox({
			displayName: 'Untag ?',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		if (context.propsValue.untag) {
            const company = await client.companies.find({ company_id: context.propsValue.companyId! });

            const userDefinedCompanyId = company.company_id;
			const response = await client.tags.create({
				name: context.propsValue.tagName,
				companies: [
					{ id: context.propsValue.companyId!, untag: true, company_id: userDefinedCompanyId },
				],
			});

			return response;
		}

		const response = await client.tags.create({
			name: context.propsValue.tagName,
			companies: [{ id: context.propsValue.companyId }],
		});

		return response;
	},
});
