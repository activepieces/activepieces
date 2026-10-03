import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fromObjectTypeAssociationDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { findAssociationsOutputSchema } from '../output-schemas';

export const findAssociationsAction = createAction({
	auth: hubspotAuth,
	name: 'find-associations',
	classification: 'SEARCH',
	displayName: 'Find Associations',
	description: 'Lists the records of one type linked to a record.',
	audience: 'both',
	aiMetadata: { description: 'Lists all associations from one CRM object to objects of another type (e.g. a company to its contacts or deals), paging through every result. Use to discover what records are linked to a known object given its ID and the from/to object types. Read-only and idempotent.', idempotent: true },
	outputSchema: findAssociationsOutputSchema,
	props: {
		fromObjectId: Property.ShortText({
			displayName: 'From Object ID',
			description: 'Map it from an earlier Find or Get step.',
			required: true,
		}),
		fromObjectType: fromObjectTypeAssociationDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'From Object Type',
			required: true,
			description: 'The object type of that record.',
		}),
		toObjectType: fromObjectTypeAssociationDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'To Object Type',
			required: true,
			description: 'The object type of the linked records to list.',
		}),
	},
	async run(context) {
		const { fromObjectId, fromObjectType, toObjectType } = context.propsValue;

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const results = [];
		const limit = 100;
		let after: string | undefined;

		do {
			const response = await client.crm.associations.v4.basicApi.getPage(
				fromObjectType as string,
				fromObjectId as string,
				toObjectType as string,
				after,
				limit,
			);
            for(const association of response.results) {
                results.push(association);
            }
			after = response.paging?.next?.after;
		} while (after);

        return results;
	},
});
