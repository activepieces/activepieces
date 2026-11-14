import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraDataCenterAuth } from '../../auth';
import { jiraApiCall } from '.';
import { waitingPlaceholder } from './placeholders';

export const jiraCommentProps = { commentId, toOptionLabel };

function commentId() {
	return Property.Dropdown({
		auth: jiraDataCenterAuth,
		displayName: 'Comment',
		refreshers: ['issueId'],
		required: true,
		options: async ({ auth, issueId }) => {
			if (!auth || !issueId) {
				return {
					disabled: true,
					options: [],
					placeholder: waitingPlaceholder({ auth, waitingFor: 'Select an issue first' }),
				};
			}
			const response = await jiraApiCall<{ comments?: JiraComment[] }>({
				auth,
				method: HttpMethod.GET,
				resourceUri: `/issue/${issueId}/comment`,
				query: {
					orderBy: '-created',
					maxResults: COMMENT_OPTIONS_LIMIT,
				},
			});

			return {
				disabled: false,
				options: (response.comments ?? []).map((comment) => ({
					label: toOptionLabel({ comment }),
					value: comment.id,
				})),
			};
		},
	});
}

function toOptionLabel({ comment }: { comment: JiraComment }): string {
	const text = truncate({ text: (comment.body ?? '').replace(/\s+/g, ' ').trim() });
	const author = comment.author?.displayName?.trim();
	const parts = [author, text].filter((part): part is string => !!part && part.length > 0);
	return parts.length > 0 ? `${parts.join(': ')} (${comment.id})` : comment.id;
}

function truncate({ text }: { text: string }): string {
	return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH).trimEnd()}…` : text;
}

const MAX_LABEL_LENGTH = 80;
const COMMENT_OPTIONS_LIMIT = 1000;

type JiraComment = {
	id: string;
	body?: string;
	author?: {
		displayName?: string;
	};
};
