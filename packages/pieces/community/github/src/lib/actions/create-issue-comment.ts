import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateIssueCommentAction = createAction({
	auth: githubAuth,
	name: 'github_create_issue_comment',
	displayName: 'Create Issue Comment',
	description: 'Creates a comment on an issue in a GitHub repository',
	props: {
		repository: githubCommon.repositoryDropdown,
		issue_number: Property.Number({
			displayName: 'Issue Number',
			description: 'The number of the issue to comment on',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Comment Body',
			description: 'The content of the comment',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { issue_number, body } = propsValue;
		const { owner, repo } = propsValue.repository!;

		const response = await githubApiCall({
			accessToken: auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
			body: {
				body,
			},
		});

		return response;
	},
});
