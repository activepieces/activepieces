import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID' },
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
	{ key: 'fullName', label: 'Full Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'avatarUrl', label: 'Avatar', format: 'image' },
	{ key: 'timezone', label: 'Timezone' },
	{ key: 'organizationId', label: 'Organization ID' },
	{ key: 'createdAt', label: 'Created', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated', format: 'datetime' },
];

const formFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Form ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'status', label: 'Status' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'folderId', label: 'Folder ID' },
	{ key: 'organizationId', label: 'Organization ID' },
	{ key: 'numberOfSubmissions', label: 'Submissions', format: 'number' },
	{ key: 'hasDraftBlocks', label: 'Has Draft Blocks', format: 'boolean' },
	{ key: 'isClosed', label: 'Closed', format: 'boolean' },
	{ key: 'createdAt', label: 'Created', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated', format: 'datetime' },
];

const workspaceFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Workspace ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'createdByUserId', label: 'Created By User ID' },
	{ key: 'createdAt', label: 'Created', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated', format: 'datetime' },
	{
		key: 'members', label: 'Members', labelKey: 'fullName',
		listItems: [
			{ key: 'id', label: 'User ID' },
			{ key: 'fullName', label: 'Full Name' },
			{ key: 'email', label: 'Email', format: 'email' },
			{ key: 'avatarUrl', label: 'Avatar', format: 'image' },
		],
	},
];

const questionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Question ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'type', label: 'Type' },
	{ key: 'formId', label: 'Form ID' },
	{ key: 'numberOfResponses', label: 'Response Count', format: 'number' },
	{ key: 'createdAt', label: 'Created', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated', format: 'datetime' },
];

const submissionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Submission ID' },
	{ key: 'formId', label: 'Form ID' },
	{ key: 'respondentId', label: 'Respondent ID' },
	{ key: 'isCompleted', label: 'Completed', format: 'boolean' },
	{ key: 'submittedAt', label: 'Submitted At', format: 'datetime' },
	{ key: 'createdAt', label: 'Created', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated', format: 'datetime' },
	{ key: 'pdfUrl', label: 'PDF URL', format: 'url' },
	{ key: 'previewUrl', label: 'Preview URL', format: 'url' },
	{
		key: 'responses', label: 'Responses',
		listItems: [
			{ key: 'questionId', label: 'Question ID' },
			{ key: 'answer', label: 'Answer' },
		],
	},
];

export const getCurrentUserOutputSchema: OutputSchema = { fields: userFields };

export const listFormsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Forms', labelKey: 'name', listItems: formFields },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
	],
};

export const getFormOutputSchema: OutputSchema = { fields: formFields };

export const createFormOutputSchema: OutputSchema = { fields: formFields };

export const updateFormOutputSchema: OutputSchema = { fields: formFields };

export const deleteFormOutputSchema: OutputSchema = {
	fields: [
		{ key: 'form_id', label: 'Form ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const listFormQuestionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'hasResponses', label: 'Has Responses', format: 'boolean' },
		{ key: 'questions', label: 'Questions', labelKey: 'title', listItems: questionFields },
	],
};

export const listFormSubmissionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'submissions', label: 'Submissions', labelKey: 'id',
			listItems: submissionFields,
		},
		{ key: 'questions', label: 'Questions', labelKey: 'title', listItems: questionFields },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
		{
			key: 'totalNumberOfSubmissionsPerFilter', label: 'Totals by Filter',
			children: [
				{ key: 'all', label: 'All', format: 'number' },
				{ key: 'completed', label: 'Completed', format: 'number' },
				{ key: 'partial', label: 'Partial', format: 'number' },
			],
		},
	],
};

export const getFormSubmissionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'submission', label: 'Submission', children: submissionFields },
		{ key: 'questions', label: 'Questions', labelKey: 'title', listItems: questionFields },
	],
};

export const listWorkspacesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'items', label: 'Workspaces', labelKey: 'name', listItems: workspaceFields },
	],
};

export const getWorkspaceOutputSchema: OutputSchema = { fields: workspaceFields };

export const getFormMetricsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'visits', label: 'Visits', format: 'number' },
		{ key: 'visitDuration', label: 'Avg Visit Duration (s)', format: 'number' },
		{ key: 'submissions', label: 'Submissions', format: 'number' },
		{ key: 'uniqueRespondents', label: 'Unique Respondents', format: 'number' },
		{ key: 'totalViews', label: 'Total Views', format: 'number' },
		{ key: 'starts', label: 'Starts', format: 'number' },
		{ key: 'completions', label: 'Completions', format: 'number' },
		{ key: 'completionDuration', label: 'Avg Completion Duration (s)', format: 'number' },
		{ key: 'completionRate', label: 'Completion Rate (%)', format: 'number' },
	],
};

export const getFormVisitsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data', label: 'Visits by Bucket', dynamicKey: true,
			children: [
				{ key: 'totalVisits', label: 'Total Visits', format: 'number' },
			],
		},
	],
};

export const getFormSubmissionsTimeseriesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data', label: 'Submissions by Bucket', dynamicKey: true,
			children: [
				{ key: 'totalSubmissions', label: 'Total Submissions', format: 'number' },
			],
		},
	],
};

export const getFormDimensionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'source', label: 'Source', dynamicKey: true },
		{ key: 'browser', label: 'Browser', dynamicKey: true },
		{ key: 'os', label: 'OS', dynamicKey: true },
		{ key: 'device', label: 'Device', dynamicKey: true },
		{ key: 'country', label: 'Country', dynamicKey: true },
		{ key: 'city', label: 'City', dynamicKey: true },
	],
};

export const getFormDropOffOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'stats', label: 'Overall Stats',
			children: [
				{ key: 'totalVisitors', label: 'Total Visitors', format: 'number' },
				{ key: 'formStarts', label: 'Form Starts', format: 'number' },
				{ key: 'formCompletes', label: 'Form Completes', format: 'number' },
				{ key: 'completionRate', label: 'Completion Rate (%)', format: 'number' },
				{ key: 'completionTimeInSeconds', label: 'Completion Time (s)', format: 'number' },
				{ key: 'visitDurationInSeconds', label: 'Visit Duration (s)', format: 'number' },
			],
		},
		{ key: 'dataAvailableSince', label: 'Data Available Since', format: 'datetime' },
		{
			key: 'data', label: 'Per-Question Drop-off', labelKey: 'title',
			listItems: [
				{ key: 'blockGroupUuid', label: 'Question UUID' },
				{ key: 'title', label: 'Question Title' },
				{ key: 'type', label: 'Type' },
				{ key: 'views', label: 'Views', format: 'number' },
				{ key: 'answers', label: 'Answers', format: 'number' },
				{ key: 'startedViews', label: 'Started Views', format: 'number' },
				{ key: 'drops', label: 'Drops', format: 'number' },
				{ key: 'answerRate', label: 'Answer Rate (%)', format: 'number' },
			],
		},
	],
};
