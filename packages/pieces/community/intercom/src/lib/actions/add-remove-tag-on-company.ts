import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { companyIdProp } from '../common/props';
import { intercomClient } from '../common';
import { findTagByName } from '../common/lookups';
import { tagOutputSchema } from '../output-schemas';

export const addOrRemoveTagOnCompanyAction = createAction({
	auth: intercomAuth,
	name: 'add-or-remove-tag-on-company',
	classification: 'WRITE',
	displayName: 'Add/Remove Tag on Company',
	description: 'Attach or remove a tag from a specific company.',
	audience: 'human',
	aiMetadata: { description: 'Attach or remove a tag (by tag name) on a company identified by its Intercom company ID; set the Untag flag to remove rather than add. Tags are created or reused by name. Adding a tag that is already there changes nothing; removing needs the tag to exist, so a retry after removal can fail and the action is not marked idempotent.', idempotent: false },
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
	outputSchema: tagOutputSchema,
	async run(context) {
		const client = await intercomClient(context.auth);
		const existingTag = await findTagByName({ auth: context.auth, name: context.propsValue.tagName });
		const tagName = typeof existingTag?.['name'] === 'string' ? existingTag['name'] : context.propsValue.tagName;

		if (context.propsValue.untag) {
            const company = await client.companies.find({ company_id: context.propsValue.companyId! });

            const userDefinedCompanyId = company.company_id;
			const response = await client.tags.create({
				name: tagName,
				companies: [
					{ id: context.propsValue.companyId!, untag: true, company_id: userDefinedCompanyId },
				],
			});

			return response;
		}

		const response = await client.tags.create({
			name: tagName,
			companies: [{ id: context.propsValue.companyId }],
		});

		return response;
	},
});
