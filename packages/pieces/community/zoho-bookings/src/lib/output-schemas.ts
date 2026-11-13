import { OutputSchema } from '@activepieces/pieces-framework';

const appointmentFields: OutputSchema['fields'] = [
	{ key: 'booking_id', label: 'Booking ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'start_time', label: 'Start Time' },
	{ key: 'end_time', label: 'End Time' },
	{ key: 'iso_start_time', label: 'Start Time (ISO)', format: 'datetime' },
	{ key: 'iso_end_time', label: 'End Time (ISO)', format: 'datetime' },
	{ key: 'time_zone', label: 'Time Zone' },
	{ key: 'duration', label: 'Duration' },
	{ key: 'pre_buffer', label: 'Pre Buffer (Minutes)', format: 'number' },
	{ key: 'post_buffer', label: 'Post Buffer (Minutes)', format: 'number' },
	{ key: 'booking_type', label: 'Booking Type' },
	{ key: 'service_id', label: 'Service ID' },
	{ key: 'service_name', label: 'Service Name' },
	{ key: 'service_description', label: 'Service Description' },
	{ key: 'workspace_id', label: 'Workspace ID' },
	{ key: 'workspace_name', label: 'Workspace Name' },
	{ key: 'staff_id', label: 'Staff ID' },
	{ key: 'staff_name', label: 'Staff Name' },
	{ key: 'staff_designation', label: 'Staff Designation' },
	{ key: 'staff_email', label: 'Staff Email', format: 'email' },
	{ key: 'staff_contact_number', label: 'Staff Phone' },
	{ key: 'customer_name', label: 'Customer Name' },
	{ key: 'customer_email', label: 'Customer Email', format: 'email' },
	{ key: 'customer_contact_no', label: 'Customer Phone' },
	{ key: 'customer_more_info', label: 'Customer Custom Fields' },
	{ key: 'customer_booking_time_zone', label: 'Customer Time Zone' },
	{ key: 'customer_booking_start_time', label: 'Customer Start Time' },
	{ key: 'notes', label: 'Notes' },
	{ key: 'cost', label: 'Cost' },
	{ key: 'cost_paid', label: 'Cost Paid' },
	{ key: 'due', label: 'Amount Due' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'payment_status', label: 'Payment Status' },
	{ key: 'summary_url', label: 'Summary URL', format: 'url' },
	{ key: 'summary_embed_url', label: 'Summary Embed URL', format: 'url' },
	{ key: 'booked_on', label: 'Booked On', format: 'datetime' },
	{ key: 'last_updated_time', label: 'Last Updated', format: 'datetime' },
	{ key: 'booked_ip_address', label: 'Booked From IP' },
	{ key: 'customer_notification', label: 'Customer Notification' },
	{ key: 'triggered_from', label: 'Triggered From' },
];

const appointmentHistoryField: OutputSchema['fields'][number] = {
	key: 'appointment_history',
	label: 'Appointment History',
	children: [
		{ key: 'old_start_time', label: 'Previous Start Time' },
		{ key: 'old_end_time', label: 'Previous End Time' },
		{ key: 'old_staff_id', label: 'Previous Staff ID' },
		{ key: 'old_staff_name', label: 'Previous Staff Name' },
		{ key: 'old_staff_email', label: 'Previous Staff Email', format: 'email' },
		{ key: 'old_staff_contact_number', label: 'Previous Staff Phone' },
	],
};

const triggeredByField: OutputSchema['fields'][number] = {
	key: 'triggered_by',
	label: 'Triggered By',
	format: 'email',
};

const resourceBookingFields: OutputSchema['fields'] = [
	{ key: 'resource_id', label: 'Resource ID' },
	{ key: 'resource_name', label: 'Resource Name' },
	{ key: 'resource_description', label: 'Resource Description' },
	{ key: 'maintainer_email', label: 'Resource Maintainer Email', format: 'email' },
];

const changedAppointmentFields: OutputSchema['fields'] = [
	...appointmentFields,
	appointmentHistoryField,
];

const bookedAppointmentFields: OutputSchema['fields'] = [
	...appointmentFields,
	triggeredByField,
	...resourceBookingFields,
];

const statusMessageFields: OutputSchema['fields'] = [
	{ key: 'status', label: 'Status' },
	{ key: 'message', label: 'Message' },
];

const customerFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Customer ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'contact_number', label: 'Phone' },
	{ key: 'type', label: 'Type' },
	{ key: 'status', label: 'Status' },
];

const dateOverrideFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Override ID' },
	{ key: 'type', label: 'Type' },
	{ key: 'mode', label: 'Mode' },
	{ key: 'dates', label: 'Dates' },
	{ key: 'from_date', label: 'From Date' },
	{ key: 'to_date', label: 'To Date' },
	{ key: 'all_day', label: 'All Day' },
	{
		key: 'available_times',
		label: 'Hours',
		labelKey: 'from_time',
		listItems: [
			{ key: 'from_time', label: 'From' },
			{ key: 'to_time', label: 'To' },
		],
	},
	{ key: 'reason', label: 'Reason' },
];

const createdOverrideFields: OutputSchema['fields'] = dateOverrideFields.map((field) =>
	field.key === 'all_day' ? { ...field, format: 'boolean' } : field,
);

const resourceFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Resource ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'assigned_workspaces', label: 'Workspace IDs' },
	{ key: 'user_in_charge', label: 'User in Charge', format: 'email' },
	{ key: 'status', label: 'Status' },
];

export const zohoBookingsListWorkspacesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'workspaces',
			label: 'Workspaces',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Workspace ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'embed_url', label: 'Embed URL', format: 'url' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const zohoBookingsCreatedRecordOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' },
	],
};

export const zohoBookingsStatusMessageOutputSchema: OutputSchema = {
	fields: statusMessageFields,
};

export const zohoBookingsListServicesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'services',
			label: 'Services',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Service ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'service_type', label: 'Service Type' },
				{ key: 'duration', label: 'Duration' },
				{ key: 'buffertime', label: 'Buffer Time' },
				{ key: 'pre_buffer', label: 'Pre Buffer (Minutes)', format: 'number' },
				{ key: 'post_buffer', label: 'Post Buffer (Minutes)', format: 'number' },
				{ key: 'price', label: 'Price', format: 'number' },
				{ key: 'currency', label: 'Currency' },
				{ key: 'description', label: 'Description' },
				{ key: 'assigned_staffs', label: 'Staff IDs' },
				{ key: 'assigned_workspace', label: 'Workspace ID' },
				{ key: 'let_customer_select_staff', label: 'Customer Selects Staff', format: 'boolean' },
				{ key: 'embed_url', label: 'Embed URL', format: 'url' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const zohoBookingsListStaffOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'staff',
			label: 'Staff',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Staff ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'role', label: 'Role' },
				{ key: 'designation', label: 'Designation' },
				{ key: 'phone_number', label: 'Phone' },
				{ key: 'gender', label: 'Gender' },
				{ key: 'date_of_birth', label: 'Date of Birth' },
				{ key: 'additional_information', label: 'Additional Information' },
				{ key: 'photo', label: 'Photo', format: 'image' },
				{ key: 'assigned_services', label: 'Service IDs' },
				{ key: 'assigned_workspaces', label: 'Workspace IDs' },
				{ key: 'embed_url', label: 'Embed URL', format: 'url' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const zohoBookingsAddStaffOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Staff ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'status', label: 'Status' },
	],
};

export const zohoBookingsListResourcesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'resources',
			label: 'Resources',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Resource ID' },
				{ key: 'name', label: 'Name' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const zohoBookingsCreateResourceOutputSchema: OutputSchema = {
	fields: resourceFields,
};

export const zohoBookingsUpdateResourceOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'message',
			label: 'Resource',
			children: [...resourceFields, { key: 'assigned_services', label: 'Service IDs' }],
		},
		{ key: 'status', label: 'Status' },
	],
};

export const zohoBookingsDeleteRecordOutputSchema: OutputSchema = {
	fields: [
		{ key: 'message', label: 'Message' },
		{ key: 'status', label: 'Status' },
	],
};

export const zohoBookingsCustomerOutputSchema: OutputSchema = {
	fields: customerFields,
};

export const zohoBookingsBookAppointmentOutputSchema: OutputSchema = {
	fields: bookedAppointmentFields,
};

export const zohoBookingsAppointmentOutputSchema: OutputSchema = {
	fields: changedAppointmentFields,
};

export const zohoBookingsListAppointmentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'appointments',
			label: 'Appointments',
			labelKey: 'booking_id',
			listItems: bookedAppointmentFields,
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'next_page_available', label: 'Next Page Available', format: 'boolean' },
	],
};

export const zohoBookingsGetAvailableSlotsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'time_zone', label: 'Time Zone' },
		{ key: 'slots', label: 'Slots' },
	],
};

export const zohoBookingsListDateOverridesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'overrides',
			label: 'Overrides',
			labelKey: 'id',
			listItems: dateOverrideFields,
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'next_page_available', label: 'Next Page Available', format: 'boolean' },
	],
};

export const zohoBookingsCreateDateOverridesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status' },
		{
			key: 'overrides',
			label: 'Overrides',
			labelKey: 'id',
			listItems: createdOverrideFields,
		},
	],
};

export const zohoBookingsUpdateDateOverridesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status' },
		{
			key: 'overrides',
			label: 'Overrides',
			labelKey: 'id',
			listItems: createdOverrideFields.filter(
				(field) => field.key !== 'from_date' && field.key !== 'to_date',
			),
		},
	],
};

export const getAppointmentDetailsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'response',
			label: 'Response',
			children: [
				{ key: 'returnvalue', label: 'Appointment', children: changedAppointmentFields },
				{ key: 'status', label: 'Status' },
			],
		},
	],
};

export const bookAppointmentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'returnvalue',
			label: 'Appointment',
			children: [...appointmentFields, triggeredByField],
		},
		{ key: 'status', label: 'Status' },
	],
};

export const rescheduleAppointmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'returnvalue', label: 'Appointment', children: changedAppointmentFields },
		{ key: 'status', label: 'Status' },
	],
};

export const fetchAvailabilityOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'response',
			label: 'Response',
			children: [
				{
					key: 'returnvalue',
					label: 'Availability',
					children: [
						{ key: 'time_zone', label: 'Time Zone' },
						{ key: 'reponse', label: 'Slots Available', format: 'boolean' },
						{ key: 'data', label: 'Slots' },
					],
				},
				{ key: 'status', label: 'Status' },
			],
		},
	],
};
