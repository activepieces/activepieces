import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function postComment({
	credentials,
	tableId,
	recordId,
	message,
	assignedTo,
}: {
	credentials: SmartSuiteCredentials;
	tableId: unknown;
	recordId: unknown;
	message: unknown;
	assignedTo: unknown;
}): Promise<Record<string, unknown>> {
	const text = smartSuiteInputs.requireText({ value: message, label: 'Message' });
	const table = smartSuiteInputs.requireText({ value: tableId, label: 'Table' });
	const record = smartSuiteInputs.requireText({ value: recordId, label: 'Record ID' });
	const assignee = typeof assignedTo === 'string' ? assignedTo.trim() : '';
	return smartSuiteClient.request<Record<string, unknown>>({
		credentials,
		method: HttpMethod.POST,
		path: '/comments/',
		body: {
			application: table,
			record,
			assigned_to: assignee.length > 0 ? assignee : null,
			message: smartSuiteInputs.plainTextToDoc(text),
		},
		operation: 'add comment',
	});
}

function messageProp() {
	return Property.LongText({
		displayName: 'Message',
		required: true,
	});
}

export const addComment = createAction({
	name: 'add_comment',
	classification: 'WRITE',
	displayName: 'Add Comment',
	description: 'Adds a comment to a record.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution, table, record and member pickers; agents should use Add Comment (by ID). Posts a plain-text comment on one SmartSuite record (line breaks become paragraphs). Record followers are notified. Optionally assigns the comment to a member. Returns the comment with its ID. Not idempotent: each call posts another comment.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordDropdown({ displayName: 'Record' }),
		message: messageProp(),
		assignedTo: smartsuiteCommon.memberDropdown({
			displayName: 'Assign To',
			description: 'Optional member to assign the comment to.',
			required: false,
		}),
	},
	outputSchema: outputSchemas['comment'],
	async run({ auth, propsValue }) {
		return postComment({ credentials: smartSuiteClient.credentialsOf(auth), ...propsValue });
	},
});

export const addCommentById = createAction({
	name: 'add_comment_by_id',
	classification: 'WRITE',
	displayName: 'Add Comment (by ID)',
	description: 'Adds a comment to a record, by table ID and record ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Posts a plain-text comment on one SmartSuite record (line breaks become paragraphs). Record followers are notified. Optionally assigns the comment to a member. Returns the comment with its ID. Not idempotent: each call posts another comment. Needs the Table ID (List Tables (by ID)) and Record ID (List Records). Assign To takes a member ID from List Members. Check List Comments (by ID) first if a retry could post a duplicate.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		recordId: smartSuiteInputs.aiProps.recordId(),
		message: messageProp(),
		assignedTo: Property.ShortText({
			displayName: 'Assign To (Member ID)',
			description: 'Optional member ID to assign the comment to. Get it from List Members.',
			required: false,
		}),
	},
	outputSchema: outputSchemas['comment'],
	async run({ auth, propsValue }) {
		return postComment({ credentials: smartSuiteClient.credentialsOf(auth), ...propsValue });
	},
});
