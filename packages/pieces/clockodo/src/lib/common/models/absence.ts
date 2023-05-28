export enum AbsenceStatus {
    REQUESTED = 0,
    APPROVED = 1,
    REJECTED = 2,
    APPROVAL_WITHDRAWN = 3,
    REUQEST_WITHDRAWN = 4
}

export enum AbsenceType {
    REGULAR_VACATION = 1,
    SPECIAL_VACATION = 2,
    OVERTIME_COMPENSATION = 3,
    SICKNESS = 4,
    SICKNESS_OF_CHILD = 5,
    EDUCATION = 6,
    MATERNITY_PROTECTION = 7,
    HOMEOFFICE = 8,
    OUT_OF_OFFICE = 9,
    UNPAID_SPECIAL_VACATION = 10,
    UNPAID_SICKNESS = 11,
    UNPAID_SICKNESS_OF_CHILD = 12,
    QUARANTINE = 13,
    MILITARY_SERVICE = 14,
    SICKNESS_ALLOWANCE = 15
}

export interface Absence {
    id: number,
    users_id: number,
    date_since: string,
    date_until?: string,
    status: AbsenceStatus,
    type: AbsenceType,
    note?: string,
    count_days?: number,
    count_hours?: number,
    sick_note?: boolean,
    date_enquired?: string,
    date_approved?: string,
    approved_by?: number
}

export interface AbsenceCreateRequest {
    type: AbsenceType,
    date_since: string,
    date_until: string|null,
    note?: string|null,
    users_id?: number,
    status?: AbsenceStatus,
    sick_note?: boolean
}

export interface AbsenceUpdateRequest {
    type?: AbsenceType,
    date_since?: string,
    date_until?: string|null,
    note?: string|null,
    users_id?: number,
    status?: AbsenceStatus,
    sick_note?: boolean
}

export interface AbsenceListRequest {
    year: number,
    users_id?: number
}

export interface AbsenceListResponse {
    absences: Absence[]
}

export interface AbsenceSingleResponse {
    absence: Absence
}