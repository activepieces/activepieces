import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { jsmAuth } from '../auth';
import { JsmAuthProps, JsmDate, JsmUser, jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { approvalOutputSchema } from '../output-schemas';

export const answerApprovalAction = createAction({
	auth: jsmAuth,
	name: 'answer_approval',
	classification: 'WRITE',
	displayName: 'Answer Approval',
	description: 'Approves or declines a request that is waiting for approval.',
	audience: 'both',
	aiMetadata: {
		description:
			'Approve or decline the pending approval on a Jira Service Management request. The connected account must be one of the approvers. The decision is final for that approver, so a second call fails; it does not undo the first.',
		idempotent: false,
	},
	outputSchema: approvalOutputSchema,
	propertyGroups: [
		{
			key: 'request',
			display: 'section',
			label: 'Request',
			icon: 'inbox',
			props: ['requestKey'],
		},
		{
			key: 'decision',
			display: 'section',
			label: 'Decision',
			icon: 'send',
			props: ['decision'],
		},
	],
	props: {
		requestKey: jsmProps.request(),
		decision: Property.StaticDropdown({
			displayName: 'Decision',
			required: true,
			display: 'cards',
			options: {
				options: [
					{ label: 'Approve', value: 'approve', description: 'The request moves forward', icon: 'send' },
					{ label: 'Decline', value: 'decline', description: 'The request is rejected', icon: 'trash' },
				],
			},
		}),
		approvalId: jsmProps.approval(),
	},
	async run(context) {
		const auth = context.auth.props;
		const { requestKey, decision } = context.propsValue;
		const key = requestKey.trim();
		const approvalId =
			jsmClient.asString(context.propsValue.approvalId) ?? (await findPendingApprovalId({ auth, requestKey: key }));
		const approval = await jsmClient.request<JsmApproval>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: `/request/${encodeURIComponent(key)}/approval/${encodeURIComponent(approvalId)}`,
			body: { decision: decision === 'decline' ? 'decline' : 'approve' },
		});
		return {
			approval_id: approval.id ?? approvalId,
			issue_key: key,
			name: approval.name ?? null,
			final_decision: approval.finalDecision ?? null,
			can_answer_approval: approval.canAnswerApproval ?? null,
			created_at: approval.createdDate?.iso8601 ?? null,
			completed_at: approval.completedDate?.iso8601 ?? null,
			approvers: (approval.approvers ?? []).map((entry) => ({
				name: entry.approver?.displayName ?? null,
				email: entry.approver?.emailAddress ?? null,
				account_id: entry.approver?.accountId ?? null,
				username: entry.approver?.name ?? null,
				decision: entry.approverDecision ?? null,
			})),
		};
	},
});

async function findPendingApprovalId({ auth, requestKey }: { auth: JsmAuthProps; requestKey: string }): Promise<string> {
	const approvals = await jsmClient.paginate<JsmApproval>({
		auth,
		path: `/request/${encodeURIComponent(requestKey)}/approval`,
		limit: 100,
	});
	const pending = approvals.filter((approval) => approval.finalDecision === 'pending' && !isNil(approval.id));
	const first = pending[0]?.id;
	if (isNil(first)) {
		throw new Error(`Request ${requestKey} has no pending approval. Check that it is waiting for approval in Jira.`);
	}
	if (pending.length > 1) {
		throw new Error(
			`Request ${requestKey} has ${pending.length} pending approvals. Pick which one to answer in the Approval field under Advanced.`,
		);
	}
	return first;
}

type JsmApproval = {
	id?: string;
	name?: string;
	finalDecision?: string;
	canAnswerApproval?: boolean;
	createdDate?: JsmDate;
	completedDate?: JsmDate;
	approvers?: { approver?: JsmUser | null; approverDecision?: string }[];
};
