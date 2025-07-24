export interface PodioItem {
  item_id: number;
  app: {
    app_id: number;
    name: string;
  };
  title: string;
  fields: Array<{
    field_id: number;
    type: string;
    label: string;
    values: any[];
  }>;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
  last_edit_on?: string;
  last_edit_by?: {
    user_id: number;
    name: string;
    mail: string;
  };
}

export interface PodioTask {
  task_id: number;
  text: string;
  description?: string;
  status: 'active' | 'completed';
  responsible?: {
    user_id: number;
    name: string;
    mail: string;
  };
  ref?: {
    type: string;
    id: number;
  };
  due_date?: string;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
  completed_on?: string;
  completed_by?: {
    user_id: number;
    name: string;
    mail: string;
  };
}

export interface PodioActivity {
  activity_id: number;
  type: string;
  data: any;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
  ref?: {
    type: string;
    id: number;
  };
}

export interface PodioOrganization {
  org_id: number;
  name: string;
  logo?: string;
  url?: string;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
}

export interface PodioWorkspace {
  space_id: number;
  name: string;
  description?: string;
  org_id: number;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
}

export interface PodioApp {
  app_id: number;
  config: {
    name: string;
    description?: string;
    icon?: string;
  };
  space_id: number;
  fields: Array<{
    field_id: number;
    type: string;
    label: string;
    config: any;
  }>;
}

export interface PodioFile {
  file_id: number;
  name: string;
  description?: string;
  mimetype: string;
  size: number;
  link: string;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
}

export interface PodioComment {
  comment_id: number;
  value: string;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
  ref: {
    type: string;
    id: number;
  };
}

export interface PodioStatusUpdate {
  status_id: number;
  value: string;
  created_on: string;
  created_by: {
    user_id: number;
    name: string;
    mail: string;
  };
  ref?: {
    type: string;
    id: number;
  };
}

export interface PodioWebhookPayload {
  type: string;
  item_id?: number;
  task_id?: number;
  org_id?: number;
  space_id?: number;
}