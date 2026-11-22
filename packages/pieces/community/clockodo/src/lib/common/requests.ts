import { AbsenceCreateRequest, AbsenceStatus, AbsenceUpdateRequest } from './models/absence';
import { CustomerUpdateRequest } from './models/customer';
import { ClockResponse, ClockStartRequest } from './models/clock';
import { Entry, EntryUpdateRequest, TimeRecordEntryCreateRequest } from './models/entry';
import { ProjectBillingRequest, ProjectBudget, ProjectBudgetInput, ProjectCreateRequest, ProjectUpdateRequest } from './models/project';
import { UserCreateRequest, UserUpdateRequest } from './models/user';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

function parseId({ value, field }: { value: unknown; field: string }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^[1-9]\d{0,15}$/.test(text)) {
    throw new Error(`${field} must be a positive whole number (a Clockodo ID), got "${String(value)}".`);
  }
  return Number(text);
}

function parseOptionalId({ value, field }: { value: unknown; field: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return parseId({ value, field });
}

function parseIsoDate({ value, field }: { value: string | undefined | null; field: string }): string {
  const text = requireValue({ value, field }).trim();
  const match = ISO_DATE.exec(text);
  if (!match) {
    throw new Error(`${field} must be an ISO-8601 date like 2026-03-31, got "${value}".`);
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${field} is not a real calendar date: "${value}".`);
  }
  return text;
}

function parseIsoDateTime({ value, field }: { value: string | undefined | null; field: string }): string {
  const text = requireValue({ value, field }).trim();
  if (!ISO_DATE_TIME.test(text)) {
    throw new Error(
      `${field} must be an ISO-8601 date-time with a timezone, like 2026-03-31T09:00:00Z, got "${value}".`
    );
  }
  return toClockodoDateTime({ value: text, field });
}

function toClockodoDateTime({ value, field }: { value: string; field: string }): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    throw new Error(`${field} is not a valid date/time: "${value}".`);
  }
  return new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseYesNo({ value, field }: { value: string | undefined | null; field: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  throw new Error(`${field} must be "yes" or "no", got "${value}".`);
}

function parseChoice<T>({
  value,
  field,
  choices,
}: {
  value: string | undefined | null;
  field: string;
  choices: Record<string, T>;
}): T | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!Object.prototype.hasOwnProperty.call(choices, value)) {
    throw new Error(`${field} must be one of ${Object.keys(choices).join(', ')}, got "${value}".`);
  }
  return choices[value];
}

function parseYear({ value, field }: { value: unknown; field: string }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{4}$/.test(text)) {
    throw new Error(`${field} must be a four-digit year like 2026, got "${String(value)}".`);
  }
  return Number(text);
}

function requireValue<T>({ value, field }: { value: T | undefined | null; field: string }): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${field} is required.`);
  }
  return value;
}

function optionalText(value: string | undefined | null): string | null | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value === '' ? null : value;
}

function customerBody<T extends CustomerUpdateRequest>(input: T): T {
  return dropUndefined(input);
}

function projectBudget({
  input,
  stored,
}: {
  input: ProjectBudgetInput | undefined;
  stored?: ProjectBudget | null;
}): ProjectBudget | undefined {
  if (!input) {
    return undefined;
  }
  const flagsGiven = isSet(input.is_hours) || isSet(input.is_not_strict);
  if (input.amount === undefined || input.amount === null) {
    if (flagsGiven) {
      throw new Error('Set Budget as well when setting "Budget in hours?" or "Soft Budget"; Clockodo stores them together.');
    }
    return undefined;
  }
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error(`Budget must be a non-negative number, got ${input.amount}.`);
  }
  return {
    amount: input.amount,
    monetary: isSet(input.is_hours) ? !input.is_hours : stored?.monetary ?? true,
    hard: isSet(input.is_not_strict) ? !input.is_not_strict : stored?.hard ?? true,
    from_subprojects: stored?.from_subprojects ?? false,
  };
}

function checkboxOrStatus({
  checkbox,
  status,
  field,
}: {
  checkbox: boolean | undefined | null;
  status: string | undefined | null;
  field: string;
}): boolean | undefined {
  if (status === 'yes') {
    return true;
  }
  if (status === 'no') {
    return false;
  }
  if (status !== undefined && status !== null && status !== '' && status !== 'keep') {
    throw new Error(`${field} must be keep, yes or no, got "${status}".`);
  }
  return checkbox === true ? true : undefined;
}

function projectBilling({ billed }: { billed?: boolean }): ProjectBillingRequest | undefined {
  return billed === undefined ? undefined : { billed };
}

function parseRole({ value, required }: { value: string | undefined | null; required: boolean }): string | undefined {
  const text = (value ?? '').trim().toLowerCase();
  if (text === '') {
    if (required) {
      throw new Error('Role is required.');
    }
    return undefined;
  }
  if (text === 'teamleader' || text === 'team leader' || text === 'team_leader') {
    throw new Error('Clockodo has no team leader role; use worker and make the user a team\'s leader instead (Update Team > Leader).');
  }
  if (text !== 'worker' && text !== 'owner') {
    throw new Error(`Role must be worker or owner, got "${value}".`);
  }
  return text;
}

function parseTeamForUpdate({ value, remove }: { value: unknown; remove: boolean }): number | null | undefined {
  if (remove) {
    return null;
  }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'none') {
    return null;
  }
  return parseOptionalId({ value, field: 'Team' });
}

function needsStoredBudget(input: ProjectBudgetInput): boolean {
  return input.amount !== undefined && input.amount !== null && (!isSet(input.is_hours) || !isSet(input.is_not_strict));
}

function isSet(value: boolean | null | undefined): value is boolean {
  return value !== undefined && value !== null;
}

function projectCreateBody(input: ProjectCreateRequest & { budget_input?: ProjectBudgetInput }): ProjectCreateRequest {
  return dropUndefined({
    name: input.name,
    customers_id: input.customers_id,
    number: input.number,
    active: input.active,
    billable_default: input.billable_default,
    note: input.note,
    budget: projectBudget({ input: input.budget_input }),
  });
}

function projectUpdateBody(
  input: ProjectUpdateRequest & { budget_input?: ProjectBudgetInput; stored_budget?: ProjectBudget | null }
): ProjectUpdateRequest {
  return dropUndefined({
    name: input.name,
    customers_id: input.customers_id,
    number: input.number,
    active: input.active,
    billable_default: input.billable_default,
    note: input.note,
    budget: projectBudget({ input: input.budget_input, stored: input.stored_budget }),
  });
}

function userCreateBody(input: UserCreateRequest): UserCreateRequest {
  return dropUndefined({
    name: input.name,
    email: input.email,
    role: input.role,
    number: input.number,
    teams_id: input.teams_id,
    language: input.language,
    wage_type: input.wage_type,
    can_generally_see_absences: input.can_generally_see_absences,
    can_generally_manage_absences: input.can_generally_manage_absences,
    can_add_customers: input.can_add_customers,
  });
}

function userUpdateBody(input: UserUpdateRequest): UserUpdateRequest {
  return dropUndefined({
    name: input.name,
    email: input.email,
    role: input.role,
    number: input.number,
    active: input.active,
    teams_id: input.teams_id,
    language: input.language,
    wage_type: input.wage_type,
    can_generally_see_absences: input.can_generally_see_absences,
    can_generally_manage_absences: input.can_generally_manage_absences,
    can_add_customers: input.can_add_customers,
  });
}

function entryCreateBody(input: TimeRecordEntryCreateRequest): TimeRecordEntryCreateRequest {
  if (Date.parse(input.time_until) <= Date.parse(input.time_since)) {
    throw new Error('End Time must be after Start Time.');
  }
  return dropUndefined({
    customers_id: input.customers_id,
    projects_id: input.projects_id,
    services_id: input.services_id,
    users_id: input.users_id,
    time_since: input.time_since,
    time_until: input.time_until,
    text: input.text,
    hourly_rate: input.hourly_rate,
    billable: input.billable,
  });
}

function entryUpdateBody(input: EntryUpdateRequest): EntryUpdateRequest {
  const body = dropUndefined({
    customers_id: input.customers_id,
    projects_id: input.projects_id,
    services_id: input.services_id,
    users_id: input.users_id,
    text: input.text,
    time_since: input.time_since,
    time_until: input.time_until,
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  return body;
}

function absenceCreateBody({
  date_since,
  date_until,
  type,
  users_id,
  half_days,
  approved,
  note,
  sick_note,
}: AbsenceInput & { date_since: string; date_until: string; type: number }): AbsenceCreateRequest {
  if (date_until < date_since) {
    throw new Error('End Date must not be before Start Date.');
  }
  return dropUndefined({
    date_since,
    date_until,
    type,
    users_id,
    half_day: half_days,
    status: approved ? AbsenceStatus.APPROVED : AbsenceStatus.REQUESTED,
    note,
    sick_note,
  });
}

function absenceUpdateBody({
  date_since,
  date_until,
  type,
  status,
  half_days,
  note,
  sick_note,
}: AbsenceInput & { status?: number }): AbsenceUpdateRequest {
  if (date_since && date_until && date_until < date_since) {
    throw new Error('End Date must not be before Start Date.');
  }
  const body = dropUndefined({
    date_since,
    date_until,
    type,
    status,
    half_day: half_days,
    note,
    sick_note,
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  return body;
}

function clockStartBody(input: ClockStartRequest): ClockStartRequest {
  return dropUndefined(input);
}

function clockEntry({ response, operation }: { response: ClockResponse; operation: string }): Entry {
  const entry = operation === 'stop clock' ? response.stopped : response.running;
  if (!entry) {
    throw new Error(`Clockodo ${operation} returned no entry.`);
  }
  return entry;
}

function dropUndefined<T extends object>(input: T): T {
  const copy = { ...input };
  for (const key of objectKeys(copy)) {
    if (copy[key] === undefined) {
      delete copy[key];
    }
  }
  return copy;
}

function objectKeys<T extends object>(input: T): (keyof T)[] {
  return Reflect.ownKeys(input).filter((k): k is keyof T & string => typeof k === 'string');
}

type AbsenceInput = {
  date_since?: string;
  date_until?: string;
  type?: number;
  users_id?: number;
  half_days?: boolean;
  approved?: boolean;
  note?: string | null;
  sick_note?: boolean;
};

export const clockodoRequests = {
  parseId,
  parseOptionalId,
  parseIsoDate,
  parseIsoDateTime,
  toClockodoDateTime,
  parseYesNo,
  parseChoice,
  parseYear,
  requireValue,
  optionalText,
  customerBody,
  projectCreateBody,
  projectUpdateBody,
  checkboxOrStatus,
  compact: dropUndefined,
  needsStoredBudget,
  parseRole,
  parseTeamForUpdate,
  projectBilling,
  userCreateBody,
  userUpdateBody,
  entryCreateBody,
  entryUpdateBody,
  absenceCreateBody,
  absenceUpdateBody,
  clockStartBody,
  clockEntry,
};
