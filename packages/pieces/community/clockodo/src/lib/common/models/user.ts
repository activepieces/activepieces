export interface User {
  id: number;
  name: string;
  number?: string;
  email: string;
  role: string;
  active: boolean;
  timeformat_12h: boolean;
  weekstart_monday: boolean;
  weekend_friday: boolean;
  language: string;
  timezone: string;
  wage_type?: number;
  can_generally_see_absences: boolean;
  can_generally_manage_absences: boolean;
  can_add_customers: boolean;
  edit_lock?: string;
  edit_lock_dyn?: string;
  edit_lock_sync?: boolean;
  worktime_regulation_id?: number;
  teams_id?: number;
  nonbusinessgroups_id?: number;
}

export interface UserCreateRequest {
  name: string;
  number?: string | null;
  email: string;
  role: string;
  timeformat_12h?: boolean;
  weekstart_monday?: boolean;
  weekend_friday?: boolean;
  language?: string;
  timezone?: string;
  wage_type?: number;
  can_generally_see_absences?: boolean;
  can_generally_manage_absences?: boolean;
  can_add_customers?: boolean;
  edit_lock_sync?: boolean;
  worktime_regulation_id?: number;
  teams_id?: number;
  nonbusinessgroups_id?: number;
  mail_to_user?: boolean;
}

export interface UserUpdateRequest {
  name?: string;
  number?: string | null;
  email?: string;
  role?: string;
  active?: boolean;
  timeformat_12h?: boolean;
  weekstart_monday?: boolean;
  weekend_friday?: boolean;
  language?: string;
  timezone?: string;
  wage_type?: number;
  can_generally_see_absences?: boolean;
  can_generally_manage_absences?: boolean;
  can_add_customers?: boolean;
  edit_lock?: string;
  edit_lock_dyn?: string;
  edit_lock_sync?: boolean;
  worktime_regulation_id?: number;
  teams_id?: number;
  nonbusinessgroups_id?: number;
}

export interface UserListResponse {
  users: User[];
}

export interface UserSingleResponse {
  user: User;
}
