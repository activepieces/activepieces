import { Property } from '@activepieces/pieces-framework';

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'How many stories to return, from the top of the list (1-100). Defaults to 10.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

export const hackernewsAiProps = { limit };

type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
