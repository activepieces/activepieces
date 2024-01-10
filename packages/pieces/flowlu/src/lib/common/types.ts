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
export interface CreateTaskAPIRequest {
  name: string;
  description?: string;
  priority: number;
  plan_start_date?: string;
  deadline?: string;
  deadline_allowchange: number;
  task_checkbyowner: number;
  responsible_id?: string;
  owner_id?: string;
  type: number;
  workflow_id?: number;
  workflow_stage_id?: number;
}
