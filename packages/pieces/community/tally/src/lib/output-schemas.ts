import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID' },
	{ key: 'fullName', label: 'Full Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'avatarUrl', label: 'Avatar URL', format: 'image' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'organizationId', label: 'Organization ID' },
	{ key: 'isBlocked', label: 'Blocked', format: 'boolean' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const formSummaryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Form ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'folderId', label: 'Folder ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'isClosed', label: 'Closed', format: 'boolean' },
	{ key: 'hasDraftBlocks', label: 'Has Draft Blocks', format: 'boolean' },
	{ key: 'numberOfSubmissions', label: 'Number Of Submissions', format: 'number' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const questionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Question ID' },
	{ key: 'type', label: 'Type' },
	{ key: 'title', label: 'Title' },
	{ key: 'formId', label: 'Form ID' },
	{ key: 'isDeleted', label: 'Deleted', format: 'boolean' },
	{ key: 'numberOfResponses', label: 'Number Of Responses', format: 'number' },
];

const responseFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Response ID' },
	{ key: 'questionId', label: 'Question ID' },
	{ key: 'respondentId', label: 'Respondent ID' },
	{ key: 'answer', label: 'Answer' },
];

const submissionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Submission ID' },
	{ key: 'formId', label: 'Form ID' },
	{ key: 'isCompleted', label: 'Completed', format: 'boolean' },
	{ key: 'submittedAt', label: 'Submitted At', format: 'datetime' },
	{ key: 'previewUrl', label: 'Preview URL', format: 'url' },
	{ key: 'pdfUrl', label: 'PDF URL', format: 'url' },
	{ key: 'responses', label: 'Responses', labelKey: 'questionId', listItems: responseFields },
];

const workspaceFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Workspace ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'createdByUserId', label: 'Created By User ID' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'members', label: 'Members', labelKey: 'fullName', listItems: userFields },
];

export const listFormsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Forms', labelKey: 'name', listItems: formSummaryFields },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
	],
};

export const getFormActionOutputSchema: OutputSchema = {
	fields: [
		...formSummaryFields,
		{ key: 'settings', label: 'Settings' },
		{ key: 'blocks', label: 'Blocks' },
	],
};

export const createFormActionOutputSchema: OutputSchema = {
	fields: formSummaryFields,
};

export const updateFormActionOutputSchema: OutputSchema = {
	fields: formSummaryFields,
};

export const listFormQuestionsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'hasResponses', label: 'Has Responses', format: 'boolean' },
		{ key: 'questions', label: 'Questions', labelKey: 'title', listItems: questionFields },
	],
};

export const listSubmissionsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
		{
			key: 'totalNumberOfSubmissionsPerFilter',
			label: 'Totals',
			children: [
				{ key: 'all', label: 'All', format: 'number' },
				{ key: 'completed', label: 'Completed', format: 'number' },
				{ key: 'partial', label: 'Partial', format: 'number' },
			],
		},
		{ key: 'questions', label: 'Questions', labelKey: 'title', listItems: questionFields },
		{ key: 'submissions', label: 'Submissions', labelKey: 'id', listItems: submissionFields },
	],
};

export const getSubmissionActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'questions', label: 'Questions', labelKey: 'title', listItems: questionFields },
		{ key: 'submission', label: 'Submission', children: submissionFields },
	],
};

export const getFormMetricsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'visits', label: 'Visits', format: 'number' },
		{ key: 'submissions', label: 'Submissions', format: 'number' },
		{ key: 'uniqueRespondents', label: 'Unique Respondents', format: 'number' },
		{ key: 'starts', label: 'Starts', format: 'number' },
		{ key: 'completions', label: 'Completions', format: 'number' },
		{ key: 'completionRate', label: 'Completion Rate', format: 'number' },
		{ key: 'visitDuration', label: 'Visit Duration (seconds)', format: 'number' },
		{ key: 'completionDuration', label: 'Completion Duration (seconds)', format: 'number' },
		{ key: 'totalViews', label: 'Total Views', format: 'number' },
	],
};

export const listWorkspacesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Workspaces', labelKey: 'name', listItems: workspaceFields },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
	],
};

export const getWorkspaceActionOutputSchema: OutputSchema = {
	fields: workspaceFields,
};

export const getCurrentUserActionOutputSchema: OutputSchema = {
	fields: [
		...userFields,
		{ key: 'isOrganizationOwner', label: 'Is Organization Owner', format: 'boolean' },
		{ key: 'subscriptionPlan', label: 'Subscription Plan' },
		{ key: 'canAccessBilling', label: 'Can Access Billing', format: 'boolean' },
	],
};
