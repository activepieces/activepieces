import { taskadeAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const createProjectAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-create-project',
	displayName: 'Create Project',
	description: 'Creates a new project in a folder.',
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		content: Property.LongText({
			displayName: 'Project Content',
			description: 'Content of the new project in markdown format.',
			required: true,
		}),
	},
	async run(context) {
		const { workspace_id, folder_id, content } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.createProject({
			folderId: folder_id ?? workspace_id,
			contentType: 'text/markdown',
			content,
		});
	},
});
