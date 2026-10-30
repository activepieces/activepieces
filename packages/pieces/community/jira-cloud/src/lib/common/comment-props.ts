import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../auth';
import { sendJiraRequest } from '.';

function commentId() {
	return Property.Dropdown<string, true, typeof jiraCloudAuth>({
		auth: jiraCloudAuth,
		displayName: 'Comment',
		refreshers: ['issueId'],
		required: true,
		options: async ({ auth, issueId }) => {
			if (!auth || !issueId) {
				return {
					disabled: true,
					options: [],
					placeholder: auth ? 'Select an issue first' : 'Please connect your account first',
				};
			}
			const response = await sendJiraRequest({
				method: HttpMethod.GET,
				url: `issue/${issueId}/comment`,
				auth: auth,
				queryParams: {
					orderBy: '-created',
					expand: 'renderedBody',
				},
			});
			const comments: JiraComment[] = response.body.comments;

			return {
				disabled: false,
				options: comments.map((comment) => ({
					label: toOptionLabel({ comment }),
					value: comment.id,
				})),
			};
		},
	});
}

function toOptionLabel({ comment }: { comment: JiraComment }): string {
	const text = truncate({ text: toPlainText({ html: comment.renderedBody ?? '' }) });
	const author = comment.author?.displayName?.trim();
	const parts = [author, text].filter((part): part is string => !!part && part.length > 0);
	return parts.length > 0 ? `${parts.join(': ')} (${comment.id})` : comment.id;
}

function toPlainText({ html }: { html: string }): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function truncate({ text }: { text: string }): string {
	return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH).trimEnd()}…` : text;
}

const MAX_LABEL_LENGTH = 80;

type JiraComment = {
	id: string;
	renderedBody?: string;
	author?: {
		displayName?: string;
	};
};

export const jiraCommentProps = { commentId };
