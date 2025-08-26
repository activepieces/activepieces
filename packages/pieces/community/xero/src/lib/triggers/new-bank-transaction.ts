import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { props } from '../common/props';

function parseXeroDateToEpoch(dateVal: unknown): number {
  if (typeof dateVal === 'string') {
    if (dateVal.includes('/Date(')) {
      const match = /\/Date\((\d+)/.exec(dateVal);
      if (match && match[1]) return Number(match[1]);
    }
    const t = Date.parse(dateVal);
    if (!Number.isNaN(t)) return t;
  }
  if (typeof dateVal === 'number') return dateVal;
  return Date.now();
}

const polling: Polling<
  PiecePropValueSchema<typeof xeroAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    const { access_token } = auth;
    const tenantId = propsValue?.['tenant_id'] as string;
    const pageSize = (propsValue?.['page_size'] as number) || 200;
    const types = (propsValue?.['types'] as string[]) || [];
    const statuses = (propsValue?.['statuses'] as string[]) || [];
    const contactId = propsValue?.['contact_id'] as string | undefined;
    const bankAccountId = propsValue?.['bank_account_id'] as string | undefined;
    const bankAccountCode = propsValue?.['bank_account_code'] as string | undefined;
    const dateFrom = propsValue?.['date_from'] as string | undefined;
    const dateTo = propsValue?.['date_to'] as string | undefined;

    const whereClauses: string[] = [];
    if (types.length === 1) whereClauses.push(`Type=="${types[0]}"`);
    if (contactId) whereClauses.push(`Contact.ContactID==guid("${contactId}")`);
    if (statuses.length === 1) whereClauses.push(`Status=="${statuses[0]}"`);
    if (statuses.length > 1) whereClauses.push(`(${statuses.map((s) => `Status=="${s}"`).join(' OR ')})`);
    if (dateFrom) {
      const [y, m, d] = dateFrom.split('-');
      whereClauses.push(`Date>=DateTime(${y}, ${m}, ${d})`);
    }
    if (dateTo) {
      const [y, m, d] = dateTo.split('-');
      whereClauses.push(`Date<DateTime(${y}, ${m}, ${d})`);
    }

    if (bankAccountCode) {
      whereClauses.push(`BankAccount.Code=="${bankAccountCode.replace(/"/g, '\\"')}"`);
    }

    const results: any[] = [];
    const maxPages = 5;
    for (let page = 1; page <= maxPages; page++) {
      const queryParams: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
        order: 'UpdatedDateUTC ASC',
      };
      if (whereClauses.length > 0) {
        queryParams['where'] = whereClauses.join(' AND ');
      }

      const requestHeaders: Record<string, string> = {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'Xero-Tenant-Id': tenantId,
      };
      if (lastFetchEpochMS > 0) {
        const ifModified = new Date(lastFetchEpochMS).toISOString().slice(0, 19);
        requestHeaders['If-Modified-Since'] = ifModified;
      }

      const resp = await httpClient.sendRequest<Record<string, any>>({
        method: HttpMethod.GET,
        url: 'https://api.xero.com/api.xro/2.0/BankTransactions',
        headers: requestHeaders,
        queryParams,
      });

      if (resp.status !== 200) {
        break;
      }

      const bankTxns: any[] = resp.body?.BankTransactions ?? [];
      let filtered = bankTxns;
      if (bankAccountId) {
        filtered = filtered.filter((t) => t?.BankAccount?.AccountID === bankAccountId);
      }
      if (bankAccountCode) {
        filtered = filtered.filter((t) => t?.BankAccount?.Code === bankAccountCode);
      }

      for (const t of filtered) {
        const epoch = parseXeroDateToEpoch(t.UpdatedDateUTC || t.Date);
        results.push({ epochMilliSeconds: epoch, data: t });
      }

      if (bankTxns.length < pageSize) break;
    }

    return results;
  },
};

export const xeroNewBankTransaction = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_bank_transaction',
  displayName: 'New Bank Transaction',
  description: 'Fires when a new bank transaction is created.',
  props: {
    tenant_id: props.tenant_id,
    types: Property.StaticMultiSelectDropdown({
      displayName: 'Types',
      required: false,
      options: {
        options: [
          { label: 'RECEIVE', value: 'RECEIVE' },
          { label: 'SPEND', value: 'SPEND' },
          { label: 'RECEIVE-OVERPAYMENT', value: 'RECEIVE-OVERPAYMENT' },
          { label: 'SPEND-OVERPAYMENT', value: 'SPEND-OVERPAYMENT' },
          { label: 'RECEIVE-PREPAYMENT', value: 'RECEIVE-PREPAYMENT' },
          { label: 'SPEND-PREPAYMENT', value: 'SPEND-PREPAYMENT' },
          { label: 'RECEIVE-TRANSFER', value: 'RECEIVE-TRANSFER' },
          { label: 'SPEND-TRANSFER', value: 'SPEND-TRANSFER' },
        ],
      },
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      required: false,
      options: {
        options: [
          { label: 'AUTHORISED', value: 'AUTHORISED' },
          { label: 'DELETED', value: 'DELETED' },
        ],
      },
    }),
    contact_id: props.contact_dropdown(false),
    bank_account_id: props.bank_account_id(false),
    bank_account_code: Property.ShortText({ displayName: 'Bank Account Code', required: false }),
    date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
    page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context: any) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context: any) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context: any) {
    return await pollingHelper.test(polling, context);
  },
  async run(context: any) {
    const items = await pollingHelper.poll(polling, context);
    // Emit only first-time seen BankTransactionID to approximate "new" semantics
    const tenantId = context.propsValue['tenant_id'];
    const seenKey = `xero_bank_txn_seen_ids_${tenantId}`;
    const seen: string[] = (await context.store.get(seenKey)) || [];
    const results: any[] = [];
    for (const it of items as any[]) {
      const id = it?.BankTransactionID;
      if (id && !seen.includes(id)) {
        results.push(it);
        seen.push(id);
      }
    }
    await context.store.put(seenKey, seen);
    return results;
  },
  sampleData: undefined,
});


