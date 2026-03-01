
export interface UserGroup {
  id: number;
  name: string;
  user: number | null;
}

export interface Contact {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  type?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  type?: string;
  document_type?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  account: number;
  excluded_from_assignments: boolean;
}

export interface CustomField {
  id: number;
  name: string;
  field_type?: string;
  document_type?: string;
  required?: boolean;
}

export interface Note {
  id: number;
  content: string;
  creator: number;
  created_at: string;
  updated_at: string;
  linked_to: LinkedResource[];
  visible_to?: string;
  tags: Tag[];
}

export interface LinkedResource {
  id: number;
  type: string;
  name?: string;
}

export interface ContactFilters {
  active?: boolean;
  order?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  type?: string;
}

export interface TagFilters {
  document_type?: string;
}
