import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fromObjectTypeAssociationDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';

export const findAssociationsAction = createAction({
	auth: hubspotAuth,
	name: 'find-associations',
	displayName: 'Find Associations',
	description: 'Finds associations between objects',
	props: {
		fromObjectId: Property.ShortText({
			displayName: 'From Object ID',
			description: 'The ID of the object you want to search the association.',
			required: true,
		}),
		fromObjectType: fromObjectTypeAssociationDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'From Object Type',
			required: true,
			description: 'The type of the object you want to search the association.',
		}),
		toObjectType: fromObjectTypeAssociationDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'To Object Type',
			required: true,
			description: 'Type of the object the from object is being associated with.',
		}),
	},
	async run(context) {
		const { fromObjectId, fromObjectType, toObjectType } = context.propsValue;

		const client = new Client({ accessToken: context.auth.access_token });

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
