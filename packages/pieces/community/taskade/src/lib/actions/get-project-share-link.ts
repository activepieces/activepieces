import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { ItemAPIResponse, ShareLinkResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const getProjectShareLinkAction = createAction({
	auth: taskadeAuth,
	name: 'get_project_share_link',
	displayName: 'Get Project Share Link',
	description: 'Gets the view and edit share links of a project, if sharing is on.',
	classification: 'READ',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns the share links of one Taskade project (view link, edit link, and a check-only link when present), or enabled=false when the project has no share link. It does not turn sharing on. Anyone with the edit link can change the project, so only pass it to people the user names. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
	},
	outputSchema: taskadeOutputSchemas['shareLink'],
	async run(context) {
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		const response = await taskadeApi.request<ItemAPIResponse<ShareLinkResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/projects/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}/shareLink`,
			operation: 'get share link',
		});
		const item = response.item;
		return {
			projectId,
			enabled: Boolean(item && (item.viewUrl || item.editUrl)),
			viewUrl: item?.viewUrl ?? null,
			editUrl: item?.editUrl ?? null,
			checkUrl: item?.checkUrl ?? null,
		};
	},
});
