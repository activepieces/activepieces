import { createAction } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { issueIdOrKeyProp, issueLinkTypeIdProp } from '../common/props';
import { isNil } from '@activepieces/shared';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { jiraApiCall } from '../common';

export const linkIssuesAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'link-issues',
	displayName: 'Link Issues',
	description: 'Creates a link between two issues.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a typed link between two Jira Data Center/Server issues (e.g. blocks, relates to, duplicates), using a link-type ID and the two issue IDs/keys. Use to relate one issue to another. Not idempotent — repeating the call adds another link of that type.',
		idempotent: false,
	},
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
			await jiraApiCall({
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
