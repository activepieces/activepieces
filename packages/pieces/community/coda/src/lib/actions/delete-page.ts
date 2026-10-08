import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { deletePageActionOutputSchema } from '../output-schemas';

export const deletePageAction = createAction({
	auth: codaAuth,
	name: 'delete_page',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Page',
	description: 'Deletes a page and everything on it, including its tables.',
	audience: 'both',
	aiMetadata: {
		description: 'Deletes a Coda page with its content and any tables on it. Use only when the user asks to remove the page. A repeat call finds it gone and reports Already Deleted instead of failing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		pageIdOrName: codaProps.pageIdOrName(),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: deletePageActionOutputSchema,
	async run(context) {
		const { docId, pageIdOrName, waitForCompletion } = context.propsValue;
		const token = context.auth.secret_text;
		try {
			const response = await codaApi.request<PageMutationResponse>({
				token,
				method: HttpMethod.DELETE,
				path: `${codaApi.docPath(docId)}/pages/${codaApi.pathSegment({ value: pageIdOrName, label: 'Page ID or name' })}`,
				operation: 'delete page',
			});
			const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
			return { id: response.id ?? pageIdOrName, alreadyDeleted: false, ...mutation };
		} catch (error) {
			const status = codaApi.statusOf(error);
			if (status === 404 || status === 410) {
				return { id: pageIdOrName, alreadyDeleted: true, requestId: null, completed: true, warning: null };
			}
			throw error;
		}
	},
});

type PageMutationResponse = {
	id?: string;
	requestId?: string;
};
