export interface KommoLead {
  id?: number;
  name: string;
  price?: number;
  responsible_user_id?: number;
  status_id?: number;
  pipeline_id?: number;
  created_by?: number;
  updated_by?: number;
  created_at?: number;
  updated_at?: number;
  closed_at?: number;
  custom_fields_values?: KommoCustomField[];
  _embedded?: {
    tags?: KommoTag[];
    contacts?: KommoContact[];
    companies?: KommoCompany[];
  };
}

export interface KommoContact {
  id?: number;
  name: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id?: number;
  created_by?: number;
  updated_by?: number;
  created_at?: number;
  updated_at?: number;
  custom_fields_values?: KommoCustomField[];
  _embedded?: {
    tags?: KommoTag[];
    companies?: KommoCompany[];
  };
}

export interface KommoCompany {
  id?: number;
  name: string;
  responsible_user_id?: number;
  created_by?: number;
  updated_by?: number;
  created_at?: number;
  updated_at?: number;
  custom_fields_values?: KommoCustomField[];
  _embedded?: {
    tags?: KommoTag[];
  };
}

export interface KommoTask {
  id?: number;
  element_id: number;
  element_type: number; // 1 - contact, 2 - lead, 3 - company
  task_type: number;
  text: string;
  complete_till: string;
  status: number; // 0 - not completed, 1 - completed
  responsible_user_id?: number;
  created_by?: number;
  updated_by?: number;
  created_at?: number;
  updated_at?: number;
}

export interface KommoCustomField {
  field_id: number;
  field_name?: string;
  field_code?: string;
  values: KommoCustomFieldValue[];
}

export interface KommoCustomFieldValue {
  value: string | number;
  enum_id?: number;
  enum_code?: string;
}

export interface KommoTag {
  id?: number;
  name: string;
  color?: string;
}

export interface KommoWebhookPayload {
  leads?: {
    add?: KommoLead[];
    update?: KommoLead[];
    delete?: { id: number }[];
    status?: KommoLead[];
  };
  contacts?: {
    add?: KommoContact[];
    update?: KommoContact[];
    delete?: { id: number }[];
  };
  task?: {
    add?: KommoTask[];
    update?: KommoTask[];
    delete?: { id: number }[];
  };
}
