export enum AbsenceStatus {
  REQUESTED = 0,
  APPROVED = 1,
  DECLINED = 2,
  APPROVAL_CANCELLED = 3,
  REQUEST_CANCELLED = 4,
}

export enum AbsenceType {
  REGULAR_HOLIDAY = 1,
  SPECIAL_LEAVE = 2,
  REDUCTION_OF_OVERTIME = 3,
  SICK_DAY = 4,
  SICK_DAY_OF_CHILD = 5,
  EDUCATION = 6,
  MATERNITY_PROTECTION = 7,
  HOME_OFFICE = 8,
  WORK_OUT_OF_OFFICE = 9,
  UNPAID_SPECIAL_LEAVE = 10,
  UNPAID_SICK_DAY = 11,
  UNPAID_SICK_DAY_OF_CHILD = 12,
  QUARANTINE = 13,
  MILITARY_SERVICE = 14,
  SICK_DAY_BENEFIT = 15,
}

export interface Absence {
  id: number;
  users_id: number;
  date_since: string;
  date_until?: string;
  status: AbsenceStatus;
  type: AbsenceType;
  note?: string;
  count_days?: number;
  count_hours?: number;
  sick_note?: boolean;
  date_enquired?: string;
  date_approved?: string;
  approved_by?: number;
}

export interface AbsenceCreateRequest {
  type: AbsenceType;
  date_since: string;
  date_until: string | null;
  note?: string | null;
  users_id?: number;
  status?: AbsenceStatus;
  sick_note?: boolean;
  count_days?: number;
}

export interface AbsenceUpdateRequest {
  type?: AbsenceType;
  date_since?: string;
  date_until?: string | null;
  note?: string | null;
  users_id?: number;
  status?: AbsenceStatus;
  sick_note?: boolean;
  count_days?: number;
}

export interface AbsenceListRequest {
  year: number;
  users_id?: number;
}

export interface AbsenceListResponse {
  absences: Absence[];
}

export interface AbsenceSingleResponse {
  absence: Absence;
}
