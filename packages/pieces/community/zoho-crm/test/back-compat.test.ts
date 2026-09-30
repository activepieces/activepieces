import { Readable } from 'node:stream';
import { PropertyType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from '../src/lib/actions/read-file';
import { newContact } from '../src/lib/triggers/new-contact';
import { zohoCrm } from '../src/index';
import { asPolling, call, captureWrites, memoryStore, ok, runAction, runTrigger, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const MAIN_CONTACT_FIELDS =
  'Owner,Email,$currency_symbol,$field_states,Other_Phone,Mailing_State,Other_State,$sharing_permission,Other_Country,Last_Activity_Time,Department,$state,Unsubscribed_Mode,$process_flow,Assistant,Mailing_Country,id,Reporting_To,$approval,Enrich_Status__s,Other_City,Created_Time,$wizard_connection_path,$editable,Home_Phone,Created_By,$zia_owner_assignment,Secondary_Email,Description,Vendor_Name,Mailing_Zip,$review_process,Twitter,Other_Zip,Mailing_Street,$canvas_id,Salutation,First_Name,Full_Name,Asst_Phone,Record_Image,Modified_By,$review,Skype_ID,Phone,Account_Name';
const T0 = Date.parse('2026-09-29T10:00:00+00:00');

beforeEach(() => {
  sendRequest.mockReset();
});

describe('steps that exist on main keep their inputs and outputs', () => {
  it('New Contact asks the same API version and fields as 0.3.1 and passes the record through unchanged', async () => {
    const contact = {
      id: '1',
      Created_Time: new Date(T0 + 1000).toISOString().replace('.000Z', '+00:00'),
      $state: 'save',
      Owner: { name: 'Ann', id: '2', email: 'ann@example.com' },
      Account_Name: { name: 'Acme', id: '3' },
      $approval: { delegate: false, approve: false, reject: false, resubmit: false },
    };
    ok({ body: { data: [contact], info: { more_records: false } } });
    const { store } = memoryStore();
    await store.put('zoho_poll_cursor', { time: T0, ids: [] });
    const out = await runTrigger({ trigger: asPolling(newContact), propsValue: { additional_fields: undefined }, store });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(call(0).url).toBe('https://www.zohoapis.com/crm/v4/Contacts');
    expect(call(0).queryParams).toMatchObject({ fields: MAIN_CONTACT_FIELDS, per_page: '200', sort_by: 'Created_Time', sort_order: 'desc' });
    expect(out).toEqual([contact]);
  });

  it('New Contact still accepts the empty input that 0.3.1 flows saved', () => {
    expect(Object.keys(newContact.props)).toEqual(['additional_fields']);
    expect(newContact.props.additional_fields.required).toBe(false);
  });

  it('Read File keeps its single url input and still returns the stored file reference', async () => {
    expect(Object.keys(readFile.props)).toEqual(['url']);
    expect(readFile.props.url.type).toBe(PropertyType.SHORT_TEXT);
    ok({ body: Readable.from([Buffer.from('zip')]) });
    const written = captureWrites();
    const out = await runAction({ action: readFile, propsValue: { url: 'https://www.zohoapis.com/crm/bulk/v8/read/1/result' }, files: written.files });
    expect(out).toBe('file://stored');
  });

  it('Custom API Call keeps its inputs', () => {
    const action = zohoCrm.actions()['custom_api_call'];
    expect(Object.keys(action.props)).toEqual(['url', 'method', 'headers', 'queryParams', 'body_type', 'body', 'response_is_binary', 'failsafe', 'timeout', 'followRedirects']);
  });
});
