import { Property } from '@activepieces/pieces-framework';

export const projectsEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		description: 'Specifies the number of the project.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display name',
		required: false,
		description:
			"Specifies the project's name. This name will appear on all sales documents for the project.",
	}),
};
