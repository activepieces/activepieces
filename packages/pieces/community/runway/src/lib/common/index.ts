export * from './auth';
import { Property } from '@activepieces/pieces-framework';

export const runwayModelProperty = Property.ShortText({ displayName: 'Model', required: true });

export const runwayTaskIdProperty = Property.ShortText({
	displayName: 'Task ID',
	description: 'The UUID of the task to retrieve (copy from the task creation response)',
	required: true
});


