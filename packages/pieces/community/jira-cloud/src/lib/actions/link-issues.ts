import { createAction } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { issueIdOrKeyProp, issueLinkTypeIdProp } from '../common/props';
import { isNil } from '@activepieces/shared';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { jiraApiCall } from '../common';

export const linkIssuesAction = createAction({
	auth: jiraCloudAuth,
	name: 'link-issues',
	displayName: 'Link Issues',
	description: 'Creates a link between two issues.',
	props: {
		firstIssueId: issueIdOrKeyProp('First Issue', true),
		issueLinkTypeId: issueLinkTypeIdProp('Link Type', true),
		secondIssueId: issueIdOrKeyProp('Second Issue', true),
	},
	async run(context) {
		const { firstIssueId, issueLinkTypeId, secondIssueId } = context.propsValue;

		if (isNil(firstIssueId) || isNil(issueLinkTypeId) || isNil(secondIssueId)) {
			throw new Error('First Issue, Link Type, and Second Issue are required');
		}
		try {
			const response = await jiraApiCall({
				method: HttpMethod.POST,
				resourceUri: '/issueLink',
				auth: context.auth,
				body: {
					type: {
						id: issueLinkTypeId,
					},
					inwardIssue: {
						id: secondIssueId,
					},
					outwardIssue: {
						id: firstIssueId,
					},
				},
			});

			return { success: true };
		} catch (e) {
			return { success: false, error: (e as HttpError).message };
		}
	},
});
