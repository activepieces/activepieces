import { HttpMessageBody } from '@activepieces/pieces-common';

export interface Task {
  id: number;
  name: string;
  description: string;
  report: string;
  parent_id: number;
  prev_task_id: number;
  deadline: string;
  deadline_allowchange: number;
  plan_start_date: string;
  plan_end_date: string;
  priority: number;
  task_checkbyowner: number;
  responsible_id: number;
  time_estimate: number;
  time_spent: number;
  status_firstviewdate: string;
  start_date: string;
  closed_date: string;
  first_closed_date: string;
  closed_by: number;
  return_count: number;
  rating: number;
  ref: string;
  ref_id: string;
  module: string;
  model: string;
  model_id: number;
  type: number;
  report_complete: string;
  all_day: number;
  ordering: number;
  uuid: string;
  public_template: number;
  template_id: number;
  is_repeat: number;
  event_location: string;
  event_color: string;
  event_busy_status: number;
  event_access_type: number;
  event_calendar_id: number;
  event_type: number;
  event_etag: string;
  event_sync_type: number;
  extra_fields: string;
  archive_status: number;
  is_hidden: number;
  workflow_id: number;
  workflow_stage_id: number;
  deleted_at: null;
  is_archive: string;
  created_date: string;
  owner_id: number;
  updated_date: string;
  updated_by: number;
  status_updated_date: string;
  status_updated_by: number;
  project_stage_id: number;
  project_checkitem_id: number;
  crm_account_id: number;
}
export interface User {
  id: string;
  last_active: string;
  username: string;
  first_name: string;
  second_name: string;
  last_name: string;
  birth_date: string;
  lang_id: string;
  timezone: string;
  register_date: string;
  image: string;
  role_admin: number;
  role_login: number;
  name: string;
}
export interface Account {
  id: number;
  name: string;
  type: number;
}
export interface TaskWorkflow {
  id: number;
  name: string;
  description: string;
  ordering: number;
  created_by: number;
  updated_by: number;
  updated_date: string;
  active: number;
  deleted_at: string;
}
export interface TaskWorkflowStage {
  id: number;
  name: string;
  description: string;
  ordering: number;
  created_by: number;
  updated_by: number;
  updated_date: string;
  workflow_id: number;
  color: string;
  task_status: number;
  deleted_at: string;
}
export interface ListAPIResponse<T> extends HttpMessageBody {
  response: {
    total: number;
    total_result: number;
    page: number;
    count: number;
    items: T;
  };
}
export interface AccountHonorificTitle {
  id: number;
  name: string;
  ordering: number;
  active: number;
}
export interface AccountCategory {
  id: number;
  active: number;
  ordering: number;
  name: string;
  deleted_at: string;
}
export interface AccountIndustry {
  id: number;
  name: string;
  ordering: number;
  active: number;
  deleted_at: string;
}
export interface OpportunitySource {
  id: number;
  name: string;
  ordering: number;
  active: number;
  description: string;
  deleted_at: string;
}
export interface Opportunity {
  id: number;
  name: string;
}
export interface Pipeline {
  id: number;
  name: string;
  ordering: number;
  description: string;
  deleted_at: string;
}
export interface PipelineStage {
  id: number;
  name: string;
  ordering: number;
  active: number;
  pipeline_id: number;
  color: string;
  deleted_at: string;
}
export interface CreateTaskAPIRequest {
  name?: string;
  description?: string;
  priority?: number;
  plan_start_date?: string;
  deadline?: string;
  deadline_allowchange?: number;
  task_checkbyowner?: number;
  responsible_id?: string;
  owner_id?: string;
  type?: number;
  workflow_id?: number;
  workflow_stage_id?: number;
}

export interface CreateCRMAccountAPIRequest {
  type: number;
  name_legal_full?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  owner_id?: string;
  account_category_id?: number;
  industry_id?: number;
  web?: string;
  email?: string;
  phone?: string;
  description?: string;
  vat?: string;
  bank_details?: string;
  telegram?: string;
  skype?: string;
  link_google?: string;
  link_facebook?: string;
  link_linkedin?: string;
  link_instagram?: string;
  billing_country?: string;
  billing_state?: string;
  billing_city?: string;
  billing_zip?: string;
  billing_address_line_1?: string;
  billing_address_line_2?: string;
  billing_address_line_3?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_city?: string;
  shipping_zip?: string;
  shipping_address_line_1?: string;
  shipping_address_line_2?: string;
  shipping_address_line_3?: string;
}
export interface CreateOpportunityAPIRequest {
  name?: string;
  budget?: number;
  description?: string;
  source_id?: number;
  start_date?: string;
  deadline?: string;
  assignee_id?: string;
  customer_id?: number;
  contact_id?: number;
  pipeline_id?: number;
  pipeline_stage_id?: number;
}
