export enum AbsenceStatus {
  REQUESTED = 0,
  APPROVED = 1,
  DECLINED = 2,
  APPROVAL_CANCELLED = 3,
  REQUEST_CANCELLED = 4,
}

export type Absence = {
  id: number;
  users_id: number;
  date_since: string;
  date_until?: string | null;
  status: number;
  type: number;
  note?: string | null;
  count_days?: number | null;
  count_hours?: number | null;
  sick_note?: boolean | null;
  half_day?: boolean;
  public_note?: string | null;
  date_enquired?: string | null;
  date_approved?: string | null;
  approved_by?: number | null;
};

export type AbsenceCreateRequest = {
  type: number;
  date_since: string;
  date_until: string;
  note?: string | null;
  users_id?: number;
  status?: AbsenceStatus;
  sick_note?: boolean;
  half_day?: boolean;
};

export type AbsenceUpdateRequest = Partial<AbsenceCreateRequest>;

export type AbsenceListRequest = {
  year: number;
  users_id?: number;
};
