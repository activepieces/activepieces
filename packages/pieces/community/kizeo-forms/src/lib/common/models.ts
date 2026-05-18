export interface KizeoFormsForms {
  id: string;
  name: string;
  fields: Record<string, KizeoFormsFields>;
}
export interface KizeoFormsFields {
  caption: string;
  type: string;
  required: boolean;
}
export interface KizeoFormsDataExports {
  exports: KizeoFormsExports[];
}
export interface KizeoFormsExports {
  id: string;
  name: string;
}
export interface KizeoFormsDataUsers {
  users: KizeoFormsUsers[];
}
export interface KizeoFormsUsers {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
}
export interface KizeoFormsLists {
  id: string;
  name: string;
}
export interface KizeoFormsList {
  list_name: string;
  properties_definition: Record<string, KizeoFormsListProperty>;
  order_by: Array<{ id: string; type: string }>;
  group_by: string[];
}

export interface KizeoFormsListProperty {
  display_name: string;
  type: string;
  id: string;
}
