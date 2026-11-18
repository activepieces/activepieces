import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecordAction } from '../src/lib/actions/create-record';
import { readFile } from '../src/lib/actions/read-file';
import { createRecordAtomic } from '../src/lib/actions/ai/records';
import { updateEmailDraftAtomic } from '../src/lib/actions/ai/drafts';
import { call, ok, runAction, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const CREATE_DEFAULTS = { additional_fields: undefined, triggers: undefined, skip_automation: false };
const BIG_FIELDS = { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Big__c', data_type: 'bigint' }, { api_name: 'Amount__c', data_type: 'currency' }] };
const DRAFT = { from: undefined, to: undefined, cc: undefined, bcc: undefined, subject: undefined, content: undefined, rich_text: undefined, reply_to: undefined };
const CURRENT_DRAFT = { id: 'abc', from: 'me@x.com', to: [{ email: 'a@x.com' }], cc: [{ email: 'c@x.com' }], bcc: [{ email: 'b@x.com' }], subject: 'S', content: 'C', rich_text: true };

beforeEach(() => {
  sendRequest.mockReset();
});

describe('long integers and exact numbers', () => {
  it('refuses a long integer that arrives as an already-rounded number', async () => {
    ok({ body: BIG_FIELDS });
    await expect(
      runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Big__c: 123456789012345678 } } }),
    ).rejects.toThrow(/pass long integers above 2\^53 as text/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('refuses decimal text that cannot be sent exactly, and accepts exact values', async () => {
    ok({ body: BIG_FIELDS });
    await expect(
      runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Amount__c: '12345678901234567.89' } } }),
    ).rejects.toThrow(/sent exactly/);
    ok({ body: BIG_FIELDS });
    ok({ body: { data: [{ status: 'success', details: { id: '9' } }] }, status: 201 });
    await runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Amount__c: '1234.50', Big__c: 42 } } });
    expect(call(2).body.data[0]).toEqual({ Last_Name: 'Doe', Amount__c: 1234.5, Big__c: '42' });
  });

  it('refuses an unsafe number anywhere in an agent record before any request', async () => {
    await expect(
      runAction({ action: createRecordAtomic, propsValue: { module_api_name: 'Leads', data: { Last_Name: 'Doe', Big__c: 123456789012345678 }, skip_automation: false } }),
    ).rejects.toThrow(/Big__c arrived as a number above 2\^53/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Update Email Draft recipient lists', () => {
  it('refuses an empty recipient list before any request, because Zoho silently keeps the old recipients', async () => {
    for (const list of ['to', 'cc', 'bcc']) {
      await expect(
        runAction({ action: updateEmailDraftAtomic, propsValue: { ...DRAFT, module_api_name: 'Leads', record_id: '1', draft_id: 'abc', [list]: [] } }),
      ).rejects.toThrow(new RegExp(`${list} is empty`));
    }
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('keeps omitted recipient lists and replaces the ones passed', async () => {
    ok({ body: { __email_drafts: [CURRENT_DRAFT] } });
    ok({ body: { __email_drafts: [{ status: 'success', details: { id: 'abc' } }] } });
    await runAction({ action: updateEmailDraftAtomic, propsValue: { ...DRAFT, module_api_name: 'Leads', record_id: '1', draft_id: 'abc', cc: ['n@x.com'] } });
    expect(call(1).body.__email_drafts[0]).toMatchObject({ to: [{ email: 'a@x.com' }], cc: [{ email: 'n@x.com' }], bcc: [{ email: 'b@x.com' }] });
  });
});

describe('download redirects', () => {
  it.each([
    'https://169.254.169.254/latest/meta-data/',
    'https://127.0.0.1/x',
    'https://localhost/x',
    'https://10.0.0.5/x',
    'https://[::1]/x',
    'https://cdn.example-storage.net/object?sig=abc',
    'https://www.zohoapis.eu/crm/v8/org',
    'https://download.zoho.com:8443/v2/crm/1/f.zip',
  ])('refuses a redirect to %s before requesting it', async (location) => {
    ok({ body: undefined, status: 302, headers: { location } });
    await expect(runAction({ action: readFile, propsValue: { url: 'https://www.zohoapis.com/crm/bulk/v8/read/1/result' } })).rejects.toThrow(/stopped/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });
});
