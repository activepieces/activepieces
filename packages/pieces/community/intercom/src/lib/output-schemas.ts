import { OutputSchema } from '@activepieces/pieces-framework';

const UNIX = 'Unix timestamp in seconds.';

const referenceListFields = (label: string): OutputSchema['fields'] => [
	{ key: 'data', label, listItems: [{ key: 'id', label: 'ID' }] },
	{ key: 'total_count', label: 'Total Count', format: 'number' },
	{ key: 'has_more', label: 'Has More', format: 'boolean' },
];

const contactFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Contact ID' },
	{ key: 'role', label: 'Role', description: 'user or lead.' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'name', label: 'Name' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'external_id', label: 'External ID' },
	{ key: 'owner_id', label: 'Owner ID' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{ key: 'updated_at', label: 'Updated At', description: UNIX },
	{ key: 'signed_up_at', label: 'Signed Up At', description: UNIX },
	{ key: 'last_seen_at', label: 'Last Seen At', description: UNIX },
	{ key: 'last_replied_at', label: 'Last Replied At', description: UNIX },
	{ key: 'last_contacted_at', label: 'Last Contacted At', description: UNIX },
	{ key: 'unsubscribed_from_emails', label: 'Unsubscribed From Emails', format: 'boolean' },
	{ key: 'has_hard_bounced', label: 'Has Hard Bounced', format: 'boolean' },
	{ key: 'marked_email_as_spam', label: 'Marked Email As Spam', format: 'boolean' },
	{
		key: 'location',
		label: 'Location',
		children: [
			{ key: 'country', label: 'Country' },
			{ key: 'region', label: 'Region' },
			{ key: 'city', label: 'City' },
		],
	},
	{ key: 'custom_attributes', label: 'Custom Attributes', dynamicKey: true },
	{ key: 'tags', label: 'Tags', children: referenceListFields('Tag References') },
	{ key: 'companies', label: 'Companies', children: referenceListFields('Company References') },
];

const conversationContactFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Contact ID' },
	{ key: 'external_id', label: 'External ID' },
];

const conversationFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Conversation ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'state', label: 'State', description: 'open, closed or snoozed.' },
	{ key: 'open', label: 'Open', format: 'boolean' },
	{ key: 'read', label: 'Read', format: 'boolean' },
	{ key: 'priority', label: 'Priority' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{ key: 'updated_at', label: 'Updated At', description: UNIX },
	{ key: 'waiting_since', label: 'Waiting Since', description: UNIX },
	{ key: 'snoozed_until', label: 'Snoozed Until', description: UNIX },
	{ key: 'admin_assignee_id', label: 'Assigned Admin ID' },
	{ key: 'team_assignee_id', label: 'Assigned Team ID' },
	{
		key: 'source',
		label: 'First Message',
		children: [
			{ key: 'type', label: 'Type' },
			{ key: 'delivered_as', label: 'Delivered As' },
			{ key: 'subject', label: 'Subject' },
			{ key: 'body', label: 'Body', format: 'html' },
			{ key: 'url', label: 'URL', format: 'url' },
			{
				key: 'author',
				label: 'Author',
				children: [
					{ key: 'type', label: 'Type' },
					{ key: 'id', label: 'ID' },
					{ key: 'name', label: 'Name' },
					{ key: 'email', label: 'Email', format: 'email' },
				],
			},
		],
	},
	{
		key: 'contacts',
		label: 'Contacts',
		children: [{ key: 'contacts', label: 'Contacts', labelKey: 'id', listItems: conversationContactFields }],
	},
	{
		key: 'tags',
		label: 'Tags',
		children: [
			{
				key: 'tags',
				label: 'Tags',
				labelKey: 'name',
				listItems: [
					{ key: 'id', label: 'Tag ID' },
					{ key: 'name', label: 'Name' },
				],
			},
		],
	},
	{
		key: 'conversation_rating',
		label: 'Rating',
		children: [
			{ key: 'rating', label: 'Rating', format: 'number' },
			{ key: 'remark', label: 'Remark' },
			{ key: 'created_at', label: 'Rated At', description: UNIX },
		],
	},
	{
		key: 'statistics',
		label: 'Statistics',
		children: [
			{ key: 'first_admin_reply_at', label: 'First Admin Reply At', description: UNIX },
			{ key: 'last_close_at', label: 'Last Closed At', description: UNIX },
			{ key: 'count_reopens', label: 'Reopen Count', format: 'number' },
			{ key: 'count_conversation_parts', label: 'Part Count', format: 'number' },
		],
	},
	{ key: 'custom_attributes', label: 'Custom Attributes', dynamicKey: true },
	{ key: 'ai_agent_participated', label: 'AI Agent Participated', format: 'boolean' },
];

const conversationPartFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Part ID' },
	{ key: 'part_type', label: 'Part Type' },
	{ key: 'body', label: 'Body', format: 'html' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{
		key: 'author',
		label: 'Author',
		children: [
			{ key: 'type', label: 'Type' },
			{ key: 'id', label: 'ID' },
			{ key: 'name', label: 'Name' },
			{ key: 'email', label: 'Email', format: 'email' },
		],
	},
];

const flatPartFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Part ID' },
	{ key: 'part_type', label: 'Part Type' },
	{ key: 'author_type', label: 'Author Type' },
	{ key: 'author_id', label: 'Author ID' },
	{ key: 'author_name', label: 'Author Name' },
	{ key: 'body', label: 'Body' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
];

const ticketFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Ticket ID', description: 'Use this ID in API calls.' },
	{ key: 'ticket_id', label: 'Inbox Ticket Number', description: 'Shown in the Intercom inbox; not used in API calls.' },
	{ key: 'category', label: 'Category' },
	{ key: 'ticket_state', label: 'State' },
	{ key: 'ticket_state_internal_label', label: 'State (Internal Label)' },
	{ key: 'ticket_state_external_label', label: 'State (Customer Label)' },
	{ key: 'open', label: 'Open', format: 'boolean' },
	{ key: 'is_shared', label: 'Shared With Customer', format: 'boolean' },
	{
		key: 'ticket_type',
		label: 'Ticket Type',
		children: [
			{ key: 'id', label: 'Ticket Type ID' },
			{ key: 'name', label: 'Name' },
		],
	},
	{ key: 'ticket_attributes', label: 'Ticket Attributes', dynamicKey: true },
	{
		key: 'contacts',
		label: 'Contacts',
		children: [{ key: 'contacts', label: 'Contacts', labelKey: 'id', listItems: conversationContactFields }],
	},
	{ key: 'admin_assignee_id', label: 'Assigned Admin ID' },
	{ key: 'team_assignee_id', label: 'Assigned Team ID' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{ key: 'updated_at', label: 'Updated At', description: UNIX },
	{ key: 'snoozed_until', label: 'Snoozed Until', description: UNIX },
];

const companyFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Intercom Company ID' },
	{ key: 'company_id', label: 'Your Company ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'plan', label: 'Plan', children: [{ key: 'name', label: 'Plan Name' }] },
	{ key: 'size', label: 'Size', format: 'number' },
	{ key: 'website', label: 'Website', format: 'url' },
	{ key: 'industry', label: 'Industry' },
	{ key: 'monthly_spend', label: 'Monthly Spend', format: 'number' },
	{ key: 'user_count', label: 'User Count', format: 'number' },
	{ key: 'session_count', label: 'Session Count', format: 'number' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{ key: 'updated_at', label: 'Updated At', description: UNIX },
	{ key: 'remote_created_at', label: 'Created At (Your System)', description: UNIX },
	{ key: 'last_request_at', label: 'Last Request At', description: UNIX },
	{ key: 'custom_attributes', label: 'Custom Attributes', dynamicKey: true },
	{
		key: 'tags',
		label: 'Tags',
		children: [
			{
				key: 'tags',
				label: 'Tags',
				labelKey: 'name',
				listItems: [
					{ key: 'id', label: 'Tag ID' },
					{ key: 'name', label: 'Name' },
				],
			},
		],
	},
];

const tagFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Tag ID' },
	{ key: 'name', label: 'Name' },
];

const noteFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Note ID' },
	{ key: 'body', label: 'Body', format: 'html' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{
		key: 'author',
		label: 'Author',
		children: [
			{ key: 'id', label: 'Admin ID' },
			{ key: 'name', label: 'Name' },
			{ key: 'email', label: 'Email', format: 'email' },
		],
	},
	{ key: 'contact', label: 'Contact', children: [{ key: 'id', label: 'Contact ID' }] },
];

const messageFields: OutputSchema['fields'] = [
	{ key: 'type', label: 'Type' },
	{ key: 'id', label: 'Message ID' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{ key: 'subject', label: 'Subject' },
	{ key: 'body', label: 'Body', format: 'html' },
	{ key: 'message_type', label: 'Message Type' },
	{ key: 'template', label: 'Email Template' },
	{ key: 'conversation_id', label: 'Conversation ID', description: 'Only present when a conversation was opened.' },
	{
		key: 'owner',
		label: 'Sent By',
		children: [
			{ key: 'id', label: 'Admin ID' },
			{ key: 'name', label: 'Name' },
			{ key: 'email', label: 'Email', format: 'email' },
		],
	},
];

const articleFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Article ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'description', label: 'Description' },
	{ key: 'body', label: 'Body', format: 'html' },
	{ key: 'author_id', label: 'Author ID' },
	{ key: 'state', label: 'State' },
	{ key: 'url', label: 'URL', format: 'url' },
	{ key: 'parent_id', label: 'Parent Collection ID' },
	{ key: 'created_at', label: 'Created At', description: UNIX },
	{ key: 'updated_at', label: 'Updated At', description: UNIX },
];

const contactWebhookFields: OutputSchema['fields'] = contactFields.map((field) =>
	field.description === UNIX ? { ...field, description: 'Date and time of the event payload.' } : field,
);

const cursorListFields = ({
	itemLabel,
	items,
	labelKey,
}: {
	itemLabel: string;
	items: OutputSchema['fields'];
	labelKey: string;
}): OutputSchema['fields'] => [
	{ key: 'items', label: itemLabel, labelKey, listItems: items },
	{ key: 'total_count', label: 'Total Matches', format: 'number' },
	{ key: 'has_more', label: 'Has More', format: 'boolean' },
	{ key: 'next_starting_after', label: 'Next Page Cursor', description: 'Pass as Starting After to get the next page.' },
];

const pagedListFields = ({
	itemLabel,
	items,
	labelKey,
}: {
	itemLabel: string;
	items: OutputSchema['fields'];
	labelKey: string;
}): OutputSchema['fields'] => [
	{ key: 'items', label: itemLabel, labelKey, listItems: items },
	{ key: 'total_count', label: 'Total Count', format: 'number' },
	{ key: 'has_more', label: 'Has More', format: 'boolean' },
	{ key: 'next_page', label: 'Next Page', format: 'number' },
];

const envelopeFields = (item: OutputSchema['fields']): OutputSchema['fields'] => [
	{ key: 'id', label: 'Notification ID' },
	{ key: 'topic', label: 'Topic' },
	{ key: 'app_id', label: 'Workspace ID' },
	{ key: 'created_at', label: 'Sent At', description: UNIX },
	{ key: 'data', label: 'Data', children: [{ key: 'item', label: 'Conversation', children: item }] },
];

export const contactOutputSchema: OutputSchema = { fields: contactFields };

export const conversationOutputSchema: OutputSchema = { fields: conversationFields };

export const conversationWithPartsOutputSchema: OutputSchema = {
	fields: [
		...conversationFields,
		{
			key: 'conversation_parts',
			label: 'Conversation Parts',
			children: [
				{ key: 'conversation_parts', label: 'Parts', labelKey: 'part_type', listItems: conversationPartFields },
				{ key: 'total_count', label: 'Total Parts', format: 'number' },
			],
		},
	],
};

export const conversationFlatPartsOutputSchema: OutputSchema = {
	fields: [...conversationFields, { key: 'parts', label: 'Parts', labelKey: 'part_type', listItems: flatPartFields }],
};

export const ticketOutputSchema: OutputSchema = { fields: ticketFields };

export const companyOutputSchema: OutputSchema = { fields: companyFields };

export const tagOutputSchema: OutputSchema = { fields: tagFields };

export const noteOutputSchema: OutputSchema = { fields: noteFields };

export const messageOutputSchema: OutputSchema = { fields: messageFields };

export const articleOutputSchema: OutputSchema = { fields: articleFields };

export const dataEventOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const listTagsOutputSchema: OutputSchema = {
	fields: [{ key: 'data', label: 'Tags', labelKey: 'name', listItems: tagFields }],
};

export const findUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'user', label: 'User', children: contactFields },
	],
};

export const findLeadOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'lead', label: 'Lead', children: contactFields },
	],
};

export const findOrCreateLeadOutputSchema: OutputSchema = {
	fields: [
		{ key: 'created', label: 'Created', format: 'boolean' },
		{ key: 'lead', label: 'Lead', children: contactFields },
	],
};

export const findCompanyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'company', label: 'Company', children: companyFields },
		{ key: 'user', label: 'Company (Legacy Key)', description: 'Same company as Company; kept for older flows.', children: companyFields },
	],
};

export const findOrCreateCompanyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'created', label: 'Created', format: 'boolean' },
		{ key: 'company', label: 'Company', children: companyFields },
	],
};

export const findConversationOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'conversation', label: 'Conversation', children: conversationFields },
	],
};

export const tagOrUntagOutputSchema: OutputSchema = {
	fields: [
		{ key: 'target', label: 'Record Type' },
		{ key: 'record_id', label: 'Record ID' },
		{ key: 'tag', label: 'Tag', children: tagFields },
		{ key: 'removed', label: 'Removed', format: 'boolean' },
		{ key: 'already_in_state', label: 'Already In That State', format: 'boolean' },
	],
};

export const searchContactsOutputSchema: OutputSchema = {
	fields: cursorListFields({ itemLabel: 'Contacts', items: contactFields, labelKey: 'email' }),
};

export const searchConversationsOutputSchema: OutputSchema = {
	fields: cursorListFields({ itemLabel: 'Conversations', items: conversationFields, labelKey: 'id' }),
};

export const searchTicketsOutputSchema: OutputSchema = {
	fields: cursorListFields({ itemLabel: 'Tickets', items: ticketFields, labelKey: 'id' }),
};

export const listContactNotesOutputSchema: OutputSchema = {
	fields: pagedListFields({ itemLabel: 'Notes', items: noteFields, labelKey: 'id' }),
};

export const listCompaniesOutputSchema: OutputSchema = {
	fields: pagedListFields({ itemLabel: 'Companies', items: companyFields, labelKey: 'name' }),
};

export const ticketReplyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'type', label: 'Type' },
		{ key: 'id', label: 'Part ID' },
		{ key: 'part_type', label: 'Part Type' },
		{ key: 'body', label: 'Body', format: 'html' },
		{ key: 'created_at', label: 'Created At', description: UNIX },
		{
			key: 'author',
			label: 'Author',
			children: [
				{ key: 'type', label: 'Type' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'email', label: 'Email', format: 'email' },
			],
		},
	],
};

export const listTicketTypesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Ticket Types',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Ticket Type ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'category', label: 'Category' },
				{ key: 'archived', label: 'Archived', format: 'boolean' },
				{
					key: 'attributes',
					label: 'Attributes',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'data_type', label: 'Data Type' },
						{ key: 'required_to_create', label: 'Required To Create', format: 'boolean' },
						{ key: 'visible_to_contacts', label: 'Visible To Contacts', format: 'boolean' },
						{
							key: 'options',
							label: 'List Options',
							labelKey: 'label',
							listItems: [
								{ key: 'id', label: 'Option ID' },
								{ key: 'label', label: 'Label' },
							],
						},
					],
				},
			],
		},
	],
};

export const listAdminsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Admins',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Admin ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'job_title', label: 'Job Title' },
				{ key: 'away_mode_enabled', label: 'Away', format: 'boolean' },
				{ key: 'has_inbox_seat', label: 'Has Inbox Seat', format: 'boolean' },
				{ key: 'team_ids', label: 'Team IDs' },
			],
		},
		{ key: 'current_admin_id', label: 'Connected Admin ID' },
	],
};

export const listTeamsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Teams',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Team ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'admin_ids', label: 'Admin IDs' },
			],
		},
	],
};

export const listSegmentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Segments',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Segment ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'person_type', label: 'Person Type', description: 'user or lead (contact).' },
				{ key: 'count', label: 'Contact Count', format: 'number', description: 'Only when Include Counts is on.' },
				{ key: 'created_at', label: 'Created At', description: UNIX },
				{ key: 'updated_at', label: 'Updated At', description: UNIX },
			],
		},
	],
};

export const listDataAttributesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Data Attributes',
			labelKey: 'label',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'full_name', label: 'Full Name' },
				{ key: 'label', label: 'Label' },
				{ key: 'data_type', label: 'Data Type' },
				{ key: 'model', label: 'Model' },
				{ key: 'custom', label: 'Custom', format: 'boolean' },
				{ key: 'api_writable', label: 'Writable Through API', format: 'boolean' },
				{ key: 'options', label: 'Options' },
			],
		},
	],
};

export const searchArticlesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'items',
			label: 'Articles',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Article ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'description', label: 'Description' },
				{ key: 'body', label: 'Body', format: 'html' },
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'state', label: 'State' },
				{ key: 'updated_at', label: 'Updated At', description: UNIX },
			],
		},
		{ key: 'total_count', label: 'Total Matches', format: 'number' },
	],
};

export const contactTriggerOutputSchema: OutputSchema = { fields: contactWebhookFields };

export const leadConvertedTriggerOutputSchema: OutputSchema = {
	fields: [
		...contactWebhookFields,
		{ key: 'merged_from', label: 'Merged From (Lead)', children: [{ key: 'id', label: 'Lead ID' }] },
	],
};

export const contactTagTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'tag', label: 'Tag', children: tagFields },
		{ key: 'contact', label: 'Contact', children: contactWebhookFields },
	],
};

const ISO = 'ISO 8601 date and time.';

const companyWebhookFields: OutputSchema['fields'] = [
	...companyFields
		.filter((field) => field.key !== 'tags')
		.map((field) => (field.description === UNIX ? { ...field, description: ISO } : field)),
	{ key: 'tag_ids', label: 'Tag IDs' },
];

const ticketWebhookFields: OutputSchema['fields'] = [
	...ticketFields
		.filter((field) => !['ticket_state', 'ticket_state_internal_label', 'ticket_state_external_label'].includes(field.key))
		.flatMap((field) =>
			field.key === 'category'
				? [
						field,
						{
							key: 'ticket_state',
							label: 'State',
							children: [
								{ key: 'id', label: 'State ID' },
								{ key: 'category', label: 'State Category', description: 'submitted, in_progress, waiting_on_customer or resolved.' },
								{ key: 'internal_label', label: 'Internal Label' },
								{ key: 'external_label', label: 'Customer Label' },
							],
						},
					]
				: [field],
		),
	{ key: 'previous_ticket_state_id', label: 'Previous State ID' },
];

export const companyTriggerOutputSchema: OutputSchema = { fields: companyWebhookFields };

export const conversationPartTaggedTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'created_at', label: 'Tagged At', description: UNIX },
		{ key: 'tag', label: 'Tag', children: tagFields },
		{ key: 'conversation', label: 'Conversation', children: conversationFields },
	],
};

export const conversationTriggerOutputSchema: OutputSchema = { fields: conversationFields };

export const conversationEnvelopeTriggerOutputSchema: OutputSchema = {
	fields: envelopeFields([
		...conversationFields,
		{
			key: 'conversation_parts',
			label: 'New Parts',
			children: [{ key: 'conversation_parts', label: 'Parts', labelKey: 'part_type', listItems: conversationPartFields }],
		},
	]),
};

export const ticketTriggerOutputSchema: OutputSchema = { fields: ticketWebhookFields };
