import { InputPropertyMap, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../auth';

function collectionName<R extends boolean>({
	required,
	displayName = 'Collection Name',
	description = 'The name of the collection needed for this action',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function must<R extends boolean>({
	required,
	displayName = 'Must Have',
	description = 'If the point have this property in his payload it will be selected',
}: PropParams<R>) {
	return Property.Object({ displayName, description, required });
}

function mustNot<R extends boolean>({
	required,
	displayName = 'Must Not Have',
	description = 'If the point have this property in his payload it will not be selected',
}: PropParams<R>) {
	return Property.Object({ displayName, description, required });
}

function getPointsBy<R extends boolean>({
	required,
	displayName = 'Choose Points By',
	description = 'The method to use to get the points',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		options: {
			options: [
				{ label: 'Ids', value: 'Ids' },
				{ label: 'Filtering', value: 'Filtering' },
			],
		},
		defaultValue: 'Ids',
		required,
	});
}

function infosToGetPoint<R extends boolean>({
	required,
	displayName = 'By ids or filtering',
	description = 'The infos to select points',
}: PropParams<R>) {
	return Property.DynamicProperties({
		auth: qdrantAuth,
		displayName,
		description,
		refreshers: ['getPointsBy'],
		props: async ({ getPointsBy }): Promise<InputPropertyMap> => {
			if (getPointsBy === 'Ids')
				return {
					ids: Property.ShortText({
						displayName: 'Ids',
						description: 'The ids of the points to choose',
						required: true,
					}),
				};
			return {
				must: must({ required: false }),
				must_not: mustNot({ required: false }),
			};
		},
		required,
	});
}

export const qdrantProps = {
	collectionName,
	must,
	mustNot,
	getPointsBy,
	infosToGetPoint,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
