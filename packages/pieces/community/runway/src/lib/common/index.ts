export * from './auth';
import { Property } from '@activepieces/pieces-framework';

export const runwayTaskIdProperty = Property.ShortText({
	displayName: 'Task ID',
	description: 'The Task ID returned by a Generate Image or Generate Video step.',
	placeholder: 'e.g. 3f2a8c1e-5b7d-4e9a-9c61-0d2f4b8e7a15',
	required: true
});


