import { OutputSchema } from '@activepieces/pieces-framework';

const messageFields: OutputSchema['fields'] = [
	{ key: 'type', label: 'Type' },
	{ key: 'message', label: 'Message' },
];

const userFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'User ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'photo_url', label: 'Photo URL', format: 'image' },
	{ key: 'email_verified_at', label: 'Email Verified At', format: 'datetime' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
	{
		key: 'pivot',
		label: 'Membership',
		children: [
			{ key: 'workspace_id', label: 'Workspace ID', format: 'number' },
			{ key: 'user_id', label: 'User ID', format: 'number' },
			{ key: 'role', label: 'Role' },
		],
	},
];

const workspaceFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Workspace ID', format: 'number' },
	{ key: 'name', label: 'Name' },
	{ key: 'icon', label: 'Icon' },
	{ key: 'plan_tier', label: 'Plan Tier' },
	{ key: 'is_trialing', label: 'Is Trialing', format: 'boolean' },
	{ key: 'users_count', label: 'Users Count', format: 'number' },
	{ key: 'is_admin', label: 'Is Admin', format: 'boolean' },
	{ key: 'is_readonly', label: 'Is Read-Only', format: 'boolean' },
	{ key: 'custom_domains', label: 'Custom Domains' },
	{ key: 'max_file_size', label: 'Max File Size (MB)', format: 'number' },
	{
		key: 'limits',
		label: 'Limits',
		children: [
			{ key: 'file_upload_size', label: 'File Upload Size', format: 'filesize' },
			{ key: 'custom_domain_count', label: 'Custom Domain Count', format: 'number' },
			{ key: 'workspace_count', label: 'Workspace Count', format: 'number' },
		],
	},
	{ key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const pageFields: OutputSchema['fields'] = [
	{
		key: 'links',
		label: 'Page Links',
		children: [
			{ key: 'first', label: 'First Page', format: 'url' },
			{ key: 'last', label: 'Last Page', format: 'url' },
			{ key: 'prev', label: 'Previous Page', format: 'url' },
			{ key: 'next', label: 'Next Page', format: 'url' },
		],
	},
	{
		key: 'meta',
		label: 'Pagination',
		children: [
			{ key: 'current_page', label: 'Current Page', format: 'number' },
			{ key: 'last_page', label: 'Last Page', format: 'number' },
			{ key: 'per_page', label: 'Per Page', format: 'number' },
			{ key: 'from', label: 'From', format: 'number' },
			{ key: 'to', label: 'To', format: 'number' },
			{ key: 'total', label: 'Total', format: 'number' },
			{ key: 'path', label: 'Path', format: 'url' },
		],
	},
];

const formFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Form ID', format: 'number' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'title', label: 'Title' },
	{ key: 'visibility', label: 'Visibility' },
	{ key: 'language', label: 'Language' },
	{ key: 'workspace_id', label: 'Workspace ID', format: 'number' },
	{ key: 'creator_id', label: 'Creator ID', format: 'number' },
	{ key: 'share_url', label: 'Share URL', format: 'url' },
	{ key: 'submissions_url', label: 'Submissions URL', format: 'url' },
	{
		key: 'properties',
		label: 'Fields',
		labelKey: 'name',
		listItems: [
			{ key: 'id', label: 'Field ID' },
			{ key: 'name', label: 'Name' },
			{ key: 'type', label: 'Type' },
			{ key: 'required', label: 'Required', format: 'boolean' },
		],
	},
	{ key: 'submitted_text', label: 'Submitted Text', format: 'html' },
	{ key: 'redirect_url', label: 'Redirect URL', format: 'url' },
	{ key: 'tags', label: 'Tags' },
	{ key: 'views_count', label: 'Views Count', format: 'number' },
	{ key: 'submissions_count', label: 'Submissions Count', format: 'number' },
	{ key: 'is_closed', label: 'Is Closed', format: 'boolean' },
	{ key: 'is_password_protected', label: 'Is Password Protected', format: 'boolean' },
	{
		key: 'max_number_of_submissions_reached',
		label: 'Max Submissions Reached',
		format: 'boolean',
	},
	{ key: 'submission_retention_value', label: 'Submission Retention Value', format: 'number' },
	{ key: 'submission_retention_unit', label: 'Submission Retention Unit' },
	{ key: 'theme', label: 'Theme' },
	{ key: 'presentation_style', label: 'Presentation Style' },
	{ key: 'width', label: 'Width' },
	{ key: 'size', label: 'Size' },
	{ key: 'border_radius', label: 'Border Radius' },
	{ key: 'dark_mode', label: 'Dark Mode' },
	{ key: 'color', label: 'Color' },
	{ key: 'uppercase_labels', label: 'Uppercase Labels', format: 'boolean' },
	{ key: 'no_branding', label: 'No Branding', format: 'boolean' },
	{ key: 'transparent_background', label: 'Transparent Background', format: 'boolean' },
	{ key: 'last_edited_human', label: 'Last Edited' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const submissionFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Submission ID', format: 'number' },
	{ key: 'form_id', label: 'Form ID', format: 'number' },
	{ key: 'data', label: 'Answers', dynamicKey: true },
	{ key: 'completion_time', label: 'Completion Time (s)', format: 'number' },
	{
		key: 'meta',
		label: 'Meta',
		children: [{ key: 'attribution', label: 'Attribution', dynamicKey: true }],
	},
];

export const opnformGetCurrentUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email', format: 'email' },
	],
};

export const opnformListWorkspacesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'workspaces', label: 'Workspaces', labelKey: 'name', listItems: workspaceFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const opnformUpdateWorkspaceOutputSchema: OutputSchema = {
	fields: [...messageFields, { key: 'workspace', label: 'Workspace', children: workspaceFields }],
};

export const opnformListWorkspaceUsersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const opnformUpdateWorkspaceUserRoleOutputSchema: OutputSchema = {
	fields: messageFields,
};

export const opnformListWorkspaceInvitesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'invites', label: 'Invites' },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const opnformGetFormOutputSchema: OutputSchema = {
	fields: [
		...formFields,
		{ key: 'description', label: 'Description', format: 'html' },
		{ key: 'submit_button_text', label: 'Submit Button Text' },
		{ key: 're_fillable', label: 'Allow Refill', format: 'boolean' },
		{ key: 're_fill_button_text', label: 'Refill Button Text' },
		{ key: 'closes_at', label: 'Closes At', format: 'datetime' },
		{ key: 'closed_text', label: 'Closed Text', format: 'html' },
		{ key: 'max_submissions_count', label: 'Max Submissions Count', format: 'number' },
		{ key: 'max_submissions_reached_text', label: 'Max Submissions Reached Text', format: 'html' },
		{ key: 'editable_submissions', label: 'Editable Submissions', format: 'boolean' },
		{ key: 'use_captcha', label: 'Use Captcha', format: 'boolean' },
		{ key: 'enable_partial_submissions', label: 'Partial Submissions', format: 'boolean' },
		{ key: 'logo_picture', label: 'Logo', format: 'image' },
		{ key: 'cover_picture', label: 'Cover Image', format: 'image' },
		{ key: 'font_family', label: 'Font Family' },
		{ key: 'custom_domain', label: 'Custom Domain' },
	],
};

export const opnformCreateFormOutputSchema: OutputSchema = {
	fields: [
		...messageFields,
		{ key: 'form', label: 'Form', children: formFields },
		{ key: 'users_first_form', label: "User's First Form", format: 'boolean' },
	],
};

export const opnformUpdateFormOutputSchema: OutputSchema = {
	fields: [...messageFields, { key: 'form', label: 'Form', children: formFields }],
};

export const opnformListFormsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Forms',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Form ID', format: 'number' },
				{ key: 'slug', label: 'Slug' },
				{ key: 'title', label: 'Title' },
				{ key: 'visibility', label: 'Visibility' },
				{ key: 'workspace_id', label: 'Workspace ID', format: 'number' },
				{ key: 'share_url', label: 'Share URL', format: 'url' },
				{ key: 'tags', label: 'Tags' },
				{ key: 'views_count', label: 'Views Count', format: 'number' },
				{ key: 'submissions_count', label: 'Submissions Count', format: 'number' },
				{ key: 'is_closed', label: 'Is Closed', format: 'boolean' },
				{ key: 'closes_at', label: 'Closes At', format: 'datetime' },
				{ key: 'max_submissions_count', label: 'Max Submissions Count', format: 'number' },
				{
					key: 'max_number_of_submissions_reached',
					label: 'Max Submissions Reached',
					format: 'boolean',
				},
				{ key: 'last_edited_human', label: 'Last Edited' },
				{ key: 'created_at', label: 'Created At', format: 'datetime' },
				{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
			],
		},
		...pageFields,
	],
};

export const opnformDeleteFormOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'form_id', label: 'Form ID' },
	],
};

export const opnformListSubmissionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Submissions', labelKey: 'id', listItems: submissionFields },
		...pageFields,
	],
};

export const opnformCreateSubmissionOutputSchema: OutputSchema = {
	fields: [
		...messageFields,
		{ key: 'submission_id', label: 'Submission ID' },
		{ key: 'is_first_submission', label: 'Is First Submission', format: 'boolean' },
		{ key: 'redirect', label: 'Redirect', format: 'boolean' },
	],
};

export const opnformUpdateSubmissionOutputSchema: OutputSchema = {
	fields: [...messageFields, { key: 'data', label: 'Submission', children: submissionFields }],
};

export const opnformDeleteSubmissionOutputSchema: OutputSchema = {
	fields: messageFields,
};

export const opnformExportSubmissionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'is_async', label: 'Is Async', format: 'boolean' },
		{ key: 'csv', label: 'CSV' },
		{ key: 'job_id', label: 'Job ID' },
		{ key: 'message', label: 'Message' },
	],
};

export const newSubmissionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'submission_id', label: 'Submission ID', format: 'number' },
		{ key: 'form_id', label: 'Form ID', format: 'number' },
		{ key: 'form_title', label: 'Form Title' },
		{ key: 'form_slug', label: 'Form Slug' },
		{
			key: 'data',
			label: 'Answers',
			dynamicKey: true,
			labelKey: 'name',
			children: [
				{ key: 'name', label: 'Field Name' },
				{ key: 'type', label: 'Field Type' },
				{ key: 'value', label: 'Value' },
			],
		},
	],
};
