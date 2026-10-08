import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { xeroUploadAttachment } from '../src/lib/actions/upload-attachment';
import { requestedHeaders, requestedUrl, runAction, stubFetch } from './helpers';

const file = { data: Buffer.from('hello'), filename: 'receipt.pdf', extension: 'pdf', base64: Buffer.from('hello').toString('base64') };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Upload Attachment', () => {
  it('keeps the Receipts option value for existing steps', () => {
    const options = xeroUploadAttachment.props.resource_type.options.options.map((option) => option.value);
    expect(options).toContain('Receipts');
  });

  it('posts the file to the resource attachment endpoint', async () => {
    const fetchMock = stubFetch({ status: 200, body: { Attachments: [{ AttachmentID: 'a1' }] } });

    const result = await runAction({
      action: xeroUploadAttachment,
      propsValue: { tenant_id: 'org-1', resource_type: 'Invoices', resource_id: 'inv-1', file },
    });

    expect(requestedUrl({ fetchMock })).toBe('https://api.xero.com/api.xro/2.0/Invoices/inv-1/Attachments/receipt.pdf');
    expect(requestedHeaders({ fetchMock }).get('xero-tenant-id')).toBe('org-1');
    expect(result).toEqual({ Attachments: [{ AttachmentID: 'a1' }] });
  });

  it.each([401, 403])('explains the missing Receipts permission when Xero answers %i', async (status) => {
    stubFetch({ status, body: { Title: 'Forbidden', Detail: 'AuthorizationUnsuccessful' } });

    await expect(
      runAction({
        action: xeroUploadAttachment,
        propsValue: { tenant_id: 'org-1', resource_type: 'Receipts', resource_id: 'r-1', file },
      }),
    ).rejects.toThrow(/accounting\.classicexpenses.*before Xero piece version 0\.8\.0/);
  });

  it('rethrows a 403 on other resource types unchanged', async () => {
    stubFetch({ status: 403, body: { Title: 'Forbidden' } });

    const error = await runAction({
      action: xeroUploadAttachment,
      propsValue: { tenant_id: 'org-1', resource_type: 'Invoices', resource_id: 'inv-1', file },
    }).then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toMatch(/classicexpenses/);
    expect(String(error)).toContain('403');
  });
});
