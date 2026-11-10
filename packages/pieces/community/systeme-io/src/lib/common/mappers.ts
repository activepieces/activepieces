type Obj = Record<string, unknown>;

function isRecord(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function obj(value: unknown): Obj {
  return isRecord(value) ? value : {};
}

function orNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

type EnrollmentRow = {
  id: unknown;
  access_type: unknown;
  active: unknown;
  course_id: unknown;
  course_name: unknown;
  contact_id: unknown;
  contact_email: unknown;
};

export function enrollmentRow(raw: unknown): EnrollmentRow {
  const e = obj(raw);
  const course = obj(e['course']);
  const contact = obj(e['contact']);
  return {
    id: orNull(e['id']),
    access_type: orNull(e['accessType']),
    active: orNull(e['active']),
    course_id: orNull(course['id']),
    course_name: orNull(course['name']),
    contact_id: orNull(contact['id']),
    contact_email: orNull(contact['email']),
  };
}

export function membershipRow(raw: unknown) {
  const m = obj(raw);
  const community = obj(m['community']);
  const contact = obj(m['contact']);
  return {
    id: orNull(m['id']),
    community_id: orNull(community['id']),
    community_name: orNull(community['name']),
    contact_id: orNull(contact['id']),
  };
}

export function subscriptionRow(raw: unknown) {
  const s = obj(raw);
  const plan = obj(s['pricePlan']);
  const recurring = obj(plan['recurringOptions']);
  return {
    id: orNull(s['id']),
    status: orNull(s['status']),
    created_at: orNull(s['createdAt']),
    cancelled_at: orNull(s['cancelledAt']),
    completed_at: orNull(s['completedAt']),
    price_plan_id: orNull(plan['id']),
    price_plan_name: orNull(plan['name']),
    price_plan_type: orNull(plan['type']),
    amount: orNull(plan['amount']),
    currency: orNull(plan['currency']),
    interval: orNull(recurring['interval']),
    interval_count: orNull(recurring['intervalCount']),
  };
}

export function courseRow(raw: unknown) {
  const c = obj(raw);
  const modules = Array.isArray(c['modules']) ? c['modules'] : [];
  return {
    id: orNull(c['id']),
    name: orNull(c['name']),
    active: orNull(c['active']),
    description: orNull(c['description']),
    path: orNull(c['path']),
    domain_name: orNull(c['domainName']),
    locale: orNull(c['locale']),
    modules: modules.map((m) => ({ id: orNull(obj(m)['id']), name: orNull(obj(m)['name']) })),
  };
}

export function communityRow(raw: unknown) {
  const c = obj(raw);
  return {
    id: orNull(c['id']),
    name: orNull(c['name']),
    path: orNull(c['path']),
    domain_name: orNull(c['domainName']),
  };
}

export function tagRow(raw: unknown) {
  const t = obj(raw);
  return {
    id: orNull(t['id']),
    name: orNull(t['name']),
    created_at: orNull(t['createdAt']),
  };
}
