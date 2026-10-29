import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi, FLAG_OPTIONS } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioCreateTimesheet = createAction({
  auth: bexioAuth,
  name: 'bexio_create_timesheet',
  classification: 'WRITE',
  displayName: 'Create Timesheet',
  description: 'Record time worked.',
  audience: 'ai',
  aiMetadata: { description: 'Records a timesheet entry, either as a duration on a date or as a start/end range, optionally against a customer, project, work package or milestone. Each call records another entry.', idempotent: false },
  outputSchema: bexioOutputSchemas.timesheetOutputSchema,
  props: {
    user_id: bexioAi.idProp({ displayName: 'User ID', description: 'Bexio user who worked the time. Get it from bexio_get_current_user.', required: true }),
    client_service_id: bexioAi.idProp({ displayName: 'Business Activity ID', description: 'Business activity ID from bexio_list_business_activities.', required: true }),
    allowable_bill: Property.StaticDropdown<string>({ displayName: 'Billable', description: 'Whether the time can be billed.', required: true, options: { disabled: false, options: FLAG_OPTIONS } }),
    tracking_type: Property.StaticDropdown<string>({ displayName: 'Tracking Type', description: 'duration = date plus hours:minutes; range = start and end timestamps.', required: true, options: { disabled: false, options: [{ label: 'Duration', value: 'duration' }, { label: 'Range', value: 'range' }] } }),
    date: Property.ShortText({ displayName: 'Date', description: 'Work date for type duration. Format YYYY-MM-DD.', required: false }),
    duration: Property.ShortText({ displayName: 'Duration', description: 'Time worked for type duration, as HH:MM, e.g. 01:30.', required: false }),
    start: Property.ShortText({ displayName: 'Start', description: 'Start for type range. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    end: Property.ShortText({ displayName: 'End', description: 'End for type range. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    text: Property.LongText({ displayName: 'Description', description: 'What was done.', required: false }),
    status_id: bexioAi.idProp({ displayName: 'Status ID', description: 'Timesheet status ID from bexio_list_timesheet_statuses.', required: false }),
    contact_id: bexioAi.idProp({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: false }),
    pr_project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Project ID from bexio_search_projects.', required: false }),
    pr_package_id: bexioAi.idProp({ displayName: 'Work Package ID', description: 'Work package ID from bexio_list_work_packages.', required: false }),
    pr_milestone_id: bexioAi.idProp({ displayName: 'Milestone ID', description: 'Milestone ID from bexio_list_milestones.', required: false }),
    charge: Property.ShortText({ displayName: 'Charge', description: 'Hourly charge as a decimal string, e.g. 120.00.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = bexioAi.buildBody({ values: propsValue, fields: { user_id: 'id', client_service_id: 'id', allowable_bill: 'flag', text: 'text', status_id: 'id', contact_id: 'id', pr_project_id: 'id', pr_package_id: 'id', pr_milestone_id: 'id', charge: 'decimal' } });
    const tracking = bexioAi.timesheetTracking({ type: propsValue.tracking_type, date: propsValue.date, duration: propsValue.duration, start: propsValue.start, end: propsValue.end });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: '/2.0/timesheet', body: { ...body, tracking } });
  },
});

export const bexioUpdateTimesheet = createAction({
  auth: bexioAuth,
  name: 'bexio_update_timesheet',
  classification: 'WRITE',
  displayName: 'Update Timesheet',
  description: 'Overwrite an existing timesheet entry.',
  audience: 'ai',
  aiMetadata: { description: 'Overwrites a timesheet entry with the given values. User, business activity, billable flag and tracked time are required every time because the connection cannot read timesheets back. Safe to retry.', idempotent: true },
  outputSchema: bexioOutputSchemas.timesheetOutputSchema,
  props: {
    timesheet_id: bexioAi.idProp({ displayName: 'Timesheet ID', description: 'Numeric timesheet ID, as returned by bexio_create_timesheet.', required: true }),
    user_id: bexioAi.idProp({ displayName: 'User ID', description: 'Bexio user who worked the time. Get it from bexio_get_current_user.', required: true }),
    client_service_id: bexioAi.idProp({ displayName: 'Business Activity ID', description: 'Business activity ID from bexio_list_business_activities.', required: true }),
    allowable_bill: Property.StaticDropdown<string>({ displayName: 'Billable', description: 'Whether the time can be billed.', required: true, options: { disabled: false, options: FLAG_OPTIONS } }),
    tracking_type: Property.StaticDropdown<string>({ displayName: 'Tracking Type', description: 'duration = date plus hours:minutes; range = start and end timestamps.', required: true, options: { disabled: false, options: [{ label: 'Duration', value: 'duration' }, { label: 'Range', value: 'range' }] } }),
    date: Property.ShortText({ displayName: 'Date', description: 'Work date for type duration. Format YYYY-MM-DD.', required: false }),
    duration: Property.ShortText({ displayName: 'Duration', description: 'Time worked for type duration, as HH:MM, e.g. 01:30.', required: false }),
    start: Property.ShortText({ displayName: 'Start', description: 'Start for type range. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    end: Property.ShortText({ displayName: 'End', description: 'End for type range. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    text: Property.LongText({ displayName: 'Description', description: 'What was done.', required: false }),
    status_id: bexioAi.idProp({ displayName: 'Status ID', description: 'Timesheet status ID from bexio_list_timesheet_statuses.', required: false }),
    contact_id: bexioAi.idProp({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: false }),
    pr_project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Project ID from bexio_search_projects.', required: false }),
    pr_package_id: bexioAi.idProp({ displayName: 'Work Package ID', description: 'Work package ID from bexio_list_work_packages.', required: false }),
    pr_milestone_id: bexioAi.idProp({ displayName: 'Milestone ID', description: 'Milestone ID from bexio_list_milestones.', required: false }),
    charge: Property.ShortText({ displayName: 'Charge', description: 'Hourly charge as a decimal string, e.g. 120.00.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = bexioAi.buildBody({ values: propsValue, fields: { user_id: 'id', client_service_id: 'id', allowable_bill: 'flag', text: 'text', status_id: 'id', contact_id: 'id', pr_project_id: 'id', pr_package_id: 'id', pr_milestone_id: 'id', charge: 'decimal' } });
    const tracking = bexioAi.timesheetTracking({ type: propsValue.tracking_type, date: propsValue.date, duration: propsValue.duration, start: propsValue.start, end: propsValue.end });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/timesheet/${bexioAi.pathId({ value: propsValue.timesheet_id, label: 'Timesheet ID' })}`, body: { ...body, tracking } });
  },
});

export const bexioDeleteTimesheet = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_timesheet',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Timesheet',
  description: 'Delete a timesheet entry.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a timesheet entry. A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    timesheet_id: bexioAi.idProp({ displayName: 'Timesheet ID', description: 'Numeric timesheet ID, as returned by bexio_create_timesheet.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/timesheet/${bexioAi.pathId({ value: propsValue.timesheet_id, label: 'Timesheet ID' })}` });
  },
});

export const bexioListTimesheetStatuses = createAction({
  auth: bexioAuth,
  name: 'bexio_list_timesheet_statuses',
  classification: 'SEARCH',
  displayName: 'List Timesheet Statuses',
  description: 'List timesheet statuses in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists timesheet statuses in Bexio; pass order_by=id_desc for newest first. Use the IDs as status_id. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/timesheet_status`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioListBusinessActivities = createAction({
  auth: bexioAuth,
  name: 'bexio_list_business_activities',
  classification: 'SEARCH',
  displayName: 'List Business Activities',
  description: 'List business activities (services billed on timesheets) in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists business activities (services billed on timesheets) in Bexio; pass order_by=id_desc for newest first. Use the IDs as client_service_id on timesheets. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.businessActivityListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/client_service`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});
