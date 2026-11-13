import { ActualApi, ActualBudgetError } from './client';

export function requireDate({ value, field }: FieldInput): string {
  const text = String(value ?? '').trim();
  const match = DATE_RE.exec(text);
  if (!match) {
    throw new ActualBudgetError(
      `${field} must be a date in YYYY-MM-DD format, got "${text}".`,
      'invalid-input'
    );
  }
  const [, y, m, d] = match.map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    throw new ActualBudgetError(
      `${field} is not a real calendar date: "${text}".`,
      'invalid-input'
    );
  }
  return text;
}

export function optionalDate({ value, field }: FieldInput): string | undefined {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined;
  }
  return requireDate({ value, field });
}

export function dateFromDateTime({ value, field }: FieldInput): string {
  const text = String(value ?? '').trim();
  const prefix = /^\d{4}-\d{2}-\d{2}/.exec(text);
  if (prefix) {
    return requireDate({ value: prefix[0], field });
  }
  const parsed = new Date(text);
  if (text === '' || Number.isNaN(parsed.getTime())) {
    throw new ActualBudgetError(
      `${field} must be a date such as 2026-10-20, got "${text}".`,
      'invalid-input'
    );
  }
  return parsed.toISOString().slice(0, 10);
}

export function requireMonth({ value, field }: FieldInput): string {
  const text = String(value ?? '').trim();
  const match = MONTH_RE.exec(text);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
    throw new ActualBudgetError(
      `${field} must be a month in YYYY-MM format, got "${text}".`,
      'invalid-input'
    );
  }
  return text;
}

export function requireId({ value, field }: FieldInput): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') {
    throw new ActualBudgetError(`${field} is required.`, 'invalid-input');
  }
  return text;
}

export function optionalId(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? undefined : text;
}

export function toCents({ value, field }: FieldInput): number {
  const num =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    throw new ActualBudgetError(
      `${field} must be a number such as -12.50, got "${String(value)}".`,
      'invalid-input'
    );
  }
  const cents = Math.round(num * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new ActualBudgetError(`${field} is too large.`, 'invalid-input');
  }
  return cents;
}

export function optionalCents({
  value,
  field,
}: FieldInput): number | undefined {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return undefined;
  }
  return toCents({ value, field });
}

export function fromCents(cents: number | null | undefined): number | null {
  if (cents === null || cents === undefined) {
    return null;
  }
  return Math.round(cents) / 100;
}

export function daysAgo({
  days,
  now = new Date(),
}: {
  days: number;
  now?: Date;
}): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function queryRows({
  api,
  query,
}: {
  api: ActualApi;
  query: ActualQuery;
}): Promise<Record<string, unknown>[]> {
  const result = await api.aqlQuery(query);
  if (!isRecord(result) || !Array.isArray(result['data'])) {
    return [];
  }
  return result['data'].filter(isRecord);
}

export async function queryTransactions({
  api,
  query,
}: {
  api: ActualApi;
  query: ActualQuery;
}): Promise<RawTransaction[]> {
  const rows = await queryRows({ api, query });
  return rows.filter(isRawTransaction);
}

export async function loadLookups(api: ActualApi): Promise<Lookups> {
  const [accounts, payees, categories] = await Promise.all([
    api.getAccounts(),
    api.getPayees(),
    api.getCategories(),
  ]);
  return {
    accounts: new Map(accounts.map((a) => [a.id, a.name])),
    payees: new Map(payees.map((p) => [p.id, p.name])),
    categories: new Map(categories.map((c) => [c.id, c.name])),
  };
}

export function mapTransaction({
  tx,
  lookups,
}: {
  tx: RawTransaction;
  lookups: Lookups;
}) {
  return {
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    amount_decimal: fromCents(tx.amount),
    account: tx.account,
    account_name: nameOf({ map: lookups.accounts, id: tx.account }),
    payee: tx.payee ?? null,
    payee_name: nameOf({ map: lookups.payees, id: tx.payee }),
    imported_payee: tx.imported_payee ?? null,
    category: tx.category ?? null,
    category_name: nameOf({ map: lookups.categories, id: tx.category }),
    notes: tx.notes ?? null,
    imported_id: tx.imported_id ?? null,
    transfer_id: tx.transfer_id ?? null,
    cleared: Boolean(tx.cleared),
    reconciled: Boolean(tx.reconciled),
    is_parent: Boolean(tx.is_parent),
    starting_balance_flag: Boolean(tx.starting_balance_flag),
    subtransactions: (tx.subtransactions ?? []).map((sub) => ({
      id: sub.id,
      amount: sub.amount,
      amount_decimal: fromCents(sub.amount),
      category: sub.category ?? null,
      category_name: nameOf({ map: lookups.categories, id: sub.category }),
      payee: sub.payee ?? null,
      payee_name: nameOf({ map: lookups.payees, id: sub.payee }),
      notes: sub.notes ?? null,
    })),
  };
}

export async function findTransactionById({
  api,
  id,
}: ApiIdInput): Promise<RawTransaction | null> {
  const rows = await queryTransactions({
    api,
    query: api
      .q('transactions')
      .filter({ id })
      .select('*')
      .options({ splits: 'grouped' }),
  });
  return rows[0] ?? null;
}

export async function requireTransaction({
  api,
  id,
}: ApiIdInput): Promise<RawTransaction> {
  const tx = await findTransactionById({ api, id });
  if (!tx) {
    throw new ActualBudgetError(
      `No transaction with ID "${id}" exists in this budget.`,
      'not-found'
    );
  }
  return tx;
}

export async function requireAccount({ api, id }: ApiIdInput) {
  const account = (await api.getAccounts()).find((a) => a.id === id);
  if (!account) {
    throw new ActualBudgetError(
      `No account with ID "${id}" exists in this budget. Use List Accounts to find IDs.`,
      'not-found'
    );
  }
  return account;
}

export async function requireCategory({ api, id }: ApiIdInput) {
  const category = (await api.getCategories()).find((c) => c.id === id);
  if (!category) {
    throw new ActualBudgetError(
      `No category with ID "${id}" exists in this budget. Use List Categories to find IDs.`,
      'not-found'
    );
  }
  return category;
}

export async function requirePayee({ api, id }: ApiIdInput) {
  const payee = (await api.getPayees()).find((p) => p.id === id);
  if (!payee) {
    throw new ActualBudgetError(
      `No payee with ID "${id}" exists in this budget. Use Find Payees to find IDs.`,
      'not-found'
    );
  }
  return payee;
}

export function failIfNothingImported(result: ImportResult): void {
  const errors = result.errors ?? [];
  if (
    errors.length > 0 &&
    (result.added ?? []).length === 0 &&
    (result.updated ?? []).length === 0
  ) {
    throw new ActualBudgetError(
      `Actual did not import the transaction(s): ${errors
        .map((e) => e.message)
        .join('; ')}`,
      'import-failed'
    );
  }
}

export async function flushWrites(api: ActualApi): Promise<void> {
  await api.sync();
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

function nameOf({
  map,
  id,
}: {
  map: Map<string, string>;
  id: string | null | undefined;
}): string | null {
  return id ? map.get(id) ?? null : null;
}

function isRawTransaction(
  value: Record<string, unknown>
): value is RawTransaction {
  return (
    typeof value['id'] === 'string' &&
    typeof value['account'] === 'string' &&
    typeof value['date'] === 'string' &&
    typeof value['amount'] === 'number'
  );
}

type FieldInput = { value: unknown; field: string };

type ApiIdInput = { api: ActualApi; id: string };

type ActualQuery = Parameters<ActualApi['aqlQuery']>[0];

export type RawTransaction = {
  id: string;
  account: string;
  date: string;
  amount: number;
  payee?: string | null;
  imported_payee?: string | null;
  category?: string | null;
  notes?: string | null;
  imported_id?: string | null;
  transfer_id?: string | null;
  cleared?: boolean;
  reconciled?: boolean;
  is_parent?: boolean;
  is_child?: boolean;
  parent_id?: string | null;
  starting_balance_flag?: boolean;
  schedule?: string | null;
  subtransactions?: RawTransaction[];
};

export type Lookups = {
  accounts: Map<string, string>;
  payees: Map<string, string>;
  categories: Map<string, string>;
};

export type MappedTransaction = ReturnType<typeof mapTransaction>;

export type ImportResult = {
  added: string[];
  updated: string[];
  errors: Array<{ message: string }>;
  updatedPreview?: unknown[];
};
