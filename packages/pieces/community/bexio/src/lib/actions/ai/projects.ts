import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListProjects = createAction({
  auth: bexioAuth,
  name: 'bexio_list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'List projects in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists projects in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.projectListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/pr_project`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchProjects = createAction({
  auth: bexioAuth,
  name: 'bexio_search_projects',
  classification: 'SEARCH',
  displayName: 'Search Projects',
  description: 'Search projects in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds projects matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.projectListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'name, contact_id, pr_state_id' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/pr_project/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetProject = createAction({
  auth: bexioAuth,
  name: 'bexio_get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Get a single project by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one project by its numeric ID with all fields. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.projectOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/pr_project/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}` });
  },
});

export const bexioCreateProject = createAction({
  auth: bexioAuth,
  name: 'bexio_create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Create a project.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a project for a customer. Needs a status from bexio_list_project_statuses and a type from bexio_list_project_types. Each call creates a new project.', idempotent: false },
  outputSchema: bexioOutputSchemas.projectOutputSchema,
  props: {
    document_nr: Property.ShortText({ displayName: 'Document Number', description: 'Can not be used if “automatic numbering” is activated in frontend-settings. Required if “automatic numbering” deactivated. https://help.bexio.com/s/article/000001721', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'Name.', required: true }),
    start_date: Property.ShortText({ displayName: 'Start Date', description: 'Start date. Format YYYY-MM-DD HH:MM:SS. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    end_date: Property.ShortText({ displayName: 'End Date', description: 'End date. Format YYYY-MM-DD HH:MM:SS. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    comment: Property.LongText({ displayName: 'Comment', description: 'Free-text comment.', required: false }),
    pr_state_id: Property.ShortText({ displayName: 'Pr State ID', description: 'Project status ID from bexio_list_project_statuses.', required: true }),
    pr_project_type_id: Property.ShortText({ displayName: 'Pr Project Type ID', description: 'Project type ID from bexio_list_project_types.', required: true }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: true }),
    contact_sub_id: Property.ShortText({ displayName: 'Contact Sub ID', description: 'References a contact object', required: false }),
    pr_invoice_type_id: Property.ShortText({ displayName: 'Pr Invoice Type ID', description: 'Billing type: 1 hourly rate of service, 2 hourly rate of employee, 3 hourly rate of project, 4 fixed price.', required: false }),
    pr_invoice_type_amount: Property.ShortText({ displayName: 'Pr Invoice Type Amount', description: 'This field can only be edited if the pr_invoice_type is set. (Only supported for invoice types: type_hourly_rate_project and type_fix)', required: false }),
    pr_budget_type_id: Property.Number({ displayName: 'Pr Budget Type ID', description: 'Budget type: 1 budgeted costs, 2 budgeted hours, 3 service budget, 4 service employees.', required: false }),
    pr_budget_type_amount: Property.ShortText({ displayName: 'Pr Budget Type Amount', description: 'This field can only be edited if the pr_budget_type is set. (Only supported for budget types: type_budgeted_costs and type_budgeted_hours)', required: false }),
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Responsible Bexio user ID from bexio_get_current_user.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/pr_project`, body: bexioAi.buildBody({ values: propsValue, fields: { document_nr: 'text', name: 'text', start_date: 'text', end_date: 'text', comment: 'text', pr_state_id: 'id', pr_project_type_id: 'id', contact_id: 'id', contact_sub_id: 'id', pr_invoice_type_id: 'id', pr_invoice_type_amount: 'text', pr_budget_type_id: 'id', pr_budget_type_amount: 'text', user_id: 'id' } }) });
  },
});

export const bexioUpdateProject = createAction({
  auth: bexioAuth,
  name: 'bexio_update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Update fields on an existing project.',
  audience: 'ai',
  aiMetadata: { description: 'Changes only the given fields on a project; omitted fields keep their value (required fields are read from the current project). Safe to retry.', idempotent: true },
  outputSchema: bexioOutputSchemas.projectOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
    document_nr: Property.ShortText({ displayName: 'Document Number', description: 'Can not be used if “automatic numbering” is activated in frontend-settings. Required if “automatic numbering” deactivated. https://help.bexio.com/s/article/000001721', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'Name.', required: false }),
    start_date: Property.ShortText({ displayName: 'Start Date', description: 'Start date. Format YYYY-MM-DD HH:MM:SS. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    end_date: Property.ShortText({ displayName: 'End Date', description: 'End date. Format YYYY-MM-DD HH:MM:SS. Format YYYY-MM-DD HH:MM:SS.', required: false }),
    comment: Property.LongText({ displayName: 'Comment', description: 'Free-text comment.', required: false }),
    pr_state_id: Property.ShortText({ displayName: 'Pr State ID', description: 'Project status ID from bexio_list_project_statuses.', required: false }),
    pr_project_type_id: Property.ShortText({ displayName: 'Pr Project Type ID', description: 'Project type ID from bexio_list_project_types.', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Customer contact ID from bexio_search_contacts.', required: false }),
    contact_sub_id: Property.ShortText({ displayName: 'Contact Sub ID', description: 'References a contact object', required: false }),
    pr_invoice_type_id: Property.ShortText({ displayName: 'Pr Invoice Type ID', description: 'Billing type: 1 hourly rate of service, 2 hourly rate of employee, 3 hourly rate of project, 4 fixed price.', required: false }),
    pr_invoice_type_amount: Property.ShortText({ displayName: 'Pr Invoice Type Amount', description: 'This field can only be edited if the pr_invoice_type is set. (Only supported for invoice types: type_hourly_rate_project and type_fix)', required: false }),
    pr_budget_type_id: Property.Number({ displayName: 'Pr Budget Type ID', description: 'Budget type: 1 budgeted costs, 2 budgeted hours, 3 service budget, 4 service employees.', required: false }),
    pr_budget_type_amount: Property.ShortText({ displayName: 'Pr Budget Type Amount', description: 'This field can only be edited if the pr_budget_type is set. (Only supported for budget types: type_budgeted_costs and type_budgeted_hours)', required: false }),
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Responsible Bexio user ID from bexio_get_current_user.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await bexioAi.fillRequired({ auth, getPath: `/2.0/pr_project/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}`, body: bexioAi.buildBody({ values: propsValue, fields: { document_nr: 'text', name: 'text', start_date: 'text', end_date: 'text', comment: 'text', pr_state_id: 'id', pr_project_type_id: 'id', contact_id: 'id', contact_sub_id: 'id', pr_invoice_type_id: 'id', pr_invoice_type_amount: 'text', pr_budget_type_id: 'id', pr_budget_type_amount: 'text', user_id: 'id' } }), required: ['name', 'pr_state_id', 'pr_project_type_id', 'contact_id', 'user_id'] });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/pr_project/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}`, body });
  },
});

export const bexioArchiveProject = createAction({
  auth: bexioAuth,
  name: 'bexio_archive_project',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Project',
  description: 'Archive a project.',
  audience: 'ai',
  aiMetadata: { description: 'Archives a project, taking it out of active use. bexio_unarchive_project reactivates it.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/pr_project/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}/archive` });
  },
});

export const bexioUnarchiveProject = createAction({
  auth: bexioAuth,
  name: 'bexio_unarchive_project',
  classification: 'WRITE',
  displayName: 'Unarchive Project',
  description: 'Reactivate an archived project.',
  audience: 'ai',
  aiMetadata: { description: 'Reactivates an archived project.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/pr_project/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}/reactivate` });
  },
});

export const bexioDeleteProject = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_project',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project',
  description: 'Delete a project.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes a project. Prefer bexio_archive_project to keep history. A second call fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/pr_project/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}` });
  },
});

export const bexioListProjectStatuses = createAction({
  auth: bexioAuth,
  name: 'bexio_list_project_statuses',
  classification: 'SEARCH',
  displayName: 'List Project Statuses',
  description: 'List project statuses in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists all project statuses in one call (no paging). Use the IDs as pr_state_id. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedAllOutputSchema,
  props: {
  },
  async run({ auth }) {
    const items = await bexioAi.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/2.0/pr_project_state` });
    const all = Array.isArray(items) ? items : [];
    return { items: all, count: all.length };
  },
});

export const bexioListProjectTypes = createAction({
  auth: bexioAuth,
  name: 'bexio_list_project_types',
  classification: 'SEARCH',
  displayName: 'List Project Types',
  description: 'List project types in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists all project types in one call (no paging). Use the IDs as pr_project_type_id. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedAllOutputSchema,
  props: {
  },
  async run({ auth }) {
    const items = await bexioAi.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/2.0/pr_project_type` });
    const all = Array.isArray(items) ? items : [];
    return { items: all, count: all.length };
  },
});

export const bexioListMilestones = createAction({
  auth: bexioAuth,
  name: 'bexio_list_milestones',
  classification: 'SEARCH',
  displayName: 'List Milestones',
  description: 'List milestones of a project in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists milestones of a project in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.milestoneListOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/projects/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}/milestones`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioCreateMilestone = createAction({
  auth: bexioAuth,
  name: 'bexio_create_milestone',
  classification: 'WRITE',
  displayName: 'Create Milestone',
  description: 'Create a project milestone.',
  audience: 'ai',
  aiMetadata: { description: 'Adds a milestone to a project. Each call creates another milestone.', idempotent: false },
  outputSchema: bexioOutputSchemas.milestoneOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'The name of the milestone', required: true }),
    end_date: Property.ShortText({ displayName: 'End Date', description: 'The end date for the milestone Format YYYY-MM-DD.', required: false }),
    comment: Property.LongText({ displayName: 'Comment', description: 'Description for milestone', required: false }),
    parent_milestone_id: Property.ShortText({ displayName: 'Parent Milestone ID', description: 'Optional parent milestone ID from bexio_list_milestones.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/3.0/projects/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}/milestones`, body: bexioAi.buildBody({ values: propsValue, fields: { name: 'text', end_date: 'text', comment: 'text', parent_milestone_id: 'id' } }) });
  },
});

export const bexioListWorkPackages = createAction({
  auth: bexioAuth,
  name: 'bexio_list_work_packages',
  classification: 'SEARCH',
  displayName: 'List Work Packages',
  description: 'List work packages of a project in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists work packages of a project in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.workPackageListOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/projects/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}/packages`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioCreateWorkPackage = createAction({
  auth: bexioAuth,
  name: 'bexio_create_work_package',
  classification: 'WRITE',
  displayName: 'Create Work Package',
  description: 'Create a project work package.',
  audience: 'ai',
  aiMetadata: { description: 'Adds a work package to a project, optionally under a milestone. Each call creates another work package.', idempotent: false },
  outputSchema: bexioOutputSchemas.workPackageOutputSchema,
  props: {
    project_id: bexioAi.idProp({ displayName: 'Project ID', description: 'Numeric project ID. Find it with bexio_search_projects or bexio_list_projects.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'The name of the work package', required: true }),
    spent_time_in_hours: Property.Number({ displayName: 'Spent Time In Hours', description: 'time spent on work package', required: false }),
    estimated_time_in_hours: Property.Number({ displayName: 'Estimated Time In Hours', description: 'estimated time on work package', required: false }),
    comment: Property.LongText({ displayName: 'Comment', description: 'Description for work package', required: false }),
    milestone_id: Property.ShortText({ displayName: 'Milestone ID', description: 'Optional milestone ID from bexio_list_milestones.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/3.0/projects/${bexioAi.pathId({ value: propsValue.project_id, label: 'Project ID' })}/packages`, body: bexioAi.buildBody({ values: propsValue, fields: { name: 'text', spent_time_in_hours: 'number', estimated_time_in_hours: 'number', comment: 'text', milestone_id: 'id' } }) });
  },
});
