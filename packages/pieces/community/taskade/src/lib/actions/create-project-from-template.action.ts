import { taskadeAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const createProjectFromTemplateAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-create-project-from-template',
	displayName: 'Create Project From Template',
	description: 'Creates a new project from a template.',
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		template_id: taskadeProps.template_id,
	},
	async run(context) {
		const { workspace_id, folder_id, template_id } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.createProjectFromTemplate({
			folderId: folder_id ?? workspace_id,
			templateId: template_id,
		});
	},
});
