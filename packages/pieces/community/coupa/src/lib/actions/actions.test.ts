import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addFileAttachment } from './add-file-attachment';
import { cancelPurchaseOrder } from './cancel-purchase-order';
import { closePurchaseOrder } from './close-purchase-order';
import { createObject } from './create-object';
import { getObjectById } from './get-object-by-id';
import { getRemitToAddresses } from './get-remit-to-addresses';
import { getSupplierSites } from './get-supplier-sites';
import { grantApproval } from './grant-approval';
import { rejectApproval } from './reject-approval';
import { searchObjects } from './search-objects';
import { setIntegrationRunStatus } from './set-integration-run-status';
import { updateObject } from './update-object';

const AUTH = {
  instanceUrl: 'acme.coupahost.com',
  clientId: 'id',
  clientSecret: 'secret',
  scope: 'core.common.read',
};

function resp(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function isTokenRequest(request: HttpRequest): boolean {
  return request.url.endsWith('/oauth2/token');
}

function context(propsValue: Record<string, unknown>) {
  return { auth: { props: AUTH }, propsValue } as never;
}

let sendRequest: ReturnType<typeof vi.spyOn>;

function mockApi(router: (request: HttpRequest) => unknown): void {
  sendRequest.mockImplementation(async (request: HttpRequest) => {
    if (isTokenRequest(request)) {
      return resp({ access_token: 'tok', expires_in: 3600 });
    }
    return resp(router(request));
  });
}

function resourceRequests(): HttpRequest[] {
  return sendRequest.mock.calls
    .map((c) => c[0] as HttpRequest)
    .filter((r) => !isTokenRequest(r));
}

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('search_objects', () => {
  it('paginates and returns standardized purchase order records', async () => {
    mockApi(() => [
      { id: 1, 'po-number': 'PO-1', status: 'issued', supplier: { id: 9, name: 'Acme' } },
    ]);

    const out = (await searchObjects.run(
      context({ module: 'purchase_orders', customResource: undefined, queryParams: undefined })
    )) as { total_count: number; records: Record<string, unknown>[] };

    expect(out.total_count).toBe(1);
    expect(out.records[0]).toMatchObject({
      po_number: 'PO-1',
      po_status: 'issued',
      supplier_id: 9,
      supplier_name: 'Acme',
    });
    expect(resourceRequests()[0].url).toBe('https://acme.coupahost.com/api/purchase_orders');
  });
});

describe('create_object', () => {
  it('POSTs the parsed body and standardizes the response', async () => {
    mockApi(() => ({ id: 5, name: 'Acme', status: 'active' }));

    const out = (await createObject.run(
      context({
        module: 'suppliers',
        customResource: undefined,
        body: { name: 'Acme' },
      })
    )) as Record<string, unknown>;

    expect(out['supplier_id']).toBe(5);
    expect(out['supplier_name']).toBe('Acme');
    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe('https://acme.coupahost.com/api/suppliers');
    expect(req.body).toEqual({ name: 'Acme' });
  });
});

describe('get_object_by_id', () => {
  it('GETs the record by id', async () => {
    mockApi(() => ({ id: 10, 'po-number': 'PO-10', status: 'draft' }));

    const out = (await getObjectById.run(
      context({
        module: 'purchase_orders',
        customResource: undefined,
        record: { objectId: 10 },
        queryParams: undefined,
      })
    )) as Record<string, unknown>;

    expect(out['po_number']).toBe('PO-10');
    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe('https://acme.coupahost.com/api/purchase_orders/10');
  });
});

describe('grant_approval', () => {
  it('PUTs to the approve endpoint', async () => {
    mockApi(() => ({ id: 7, status: 'approved' }));

    await grantApproval.run(context({ approvalId: 7 }));

    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe('https://acme.coupahost.com/api/approvals/7/approve');
  });
});

describe('reject_approval', () => {
  it('PUTs to the reject endpoint with the reason as a query param', async () => {
    mockApi(() => ({ id: 7, status: 'rejected' }));

    await rejectApproval.run(context({ approvalId: 7, reason: 'over budget' }));

    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe('https://acme.coupahost.com/api/approvals/7/reject');
    expect(req.queryParams).toEqual({ reason: 'over budget' });
  });
});

describe('cancel_purchase_order', () => {
  it('PUTs to the cancel endpoint', async () => {
    mockApi(() => ({ id: 3, status: 'cancelled' }));

    await cancelPurchaseOrder.run(context({ purchaseOrderId: 3 }));

    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe('https://acme.coupahost.com/api/purchase_orders/3/cancel');
  });
});

describe('set_integration_run_status', () => {
  it('PUTs to the status endpoint', async () => {
    mockApi(() => ({ id: 4, status: 'success' }));

    await setIntegrationRunStatus.run(
      context({ integrationRunId: 4, status: 'success' })
    );

    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe('https://acme.coupahost.com/api/integration_runs/4/success');
  });
});

describe('get_remit_to_addresses (purchase order path)', () => {
  it('resolves the supplier from the PO, then lists its addresses', async () => {
    mockApi((request) => {
      if (request.url.endsWith('/api/purchase_orders/8')) {
        return { id: 8, supplier: { id: 99 } };
      }
      return [{ id: 1, name: 'HQ' }];
    });

    const out = (await getRemitToAddresses.run(
      context({
        parentModule: 'purchase_orders',
        parentRecord: { recordId: 8 },
      })
    )) as { total_count: number; addresses: Record<string, unknown>[] };

    expect(out.total_count).toBe(1);
    const urls = resourceRequests().map((r) => r.url);
    expect(urls).toContain('https://acme.coupahost.com/api/purchase_orders/8');
    expect(urls).toContain('https://acme.coupahost.com/api/suppliers/99/addresses');
  });
});

describe('update_object', () => {
  it('PUTs the parsed body to the record by id', async () => {
    mockApi(() => ({ id: 12, name: 'Globex', status: 'inactive' }));

    const out = (await updateObject.run(
      context({
        module: 'suppliers',
        customResource: undefined,
        record: { objectId: 12 },
        body: { status: 'inactive' },
      })
    )) as Record<string, unknown>;

    expect(out['supplier_id']).toBe(12);
    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe('https://acme.coupahost.com/api/suppliers/12');
    expect(req.body).toEqual({ status: 'inactive' });
  });

  it('returns the raw response for a custom module', async () => {
    mockApi(() => ({ id: 1, raw: true }));

    const out = (await updateObject.run(
      context({
        module: '__custom__',
        customResource: 'invoices',
        record: { objectId: 1 },
        body: {},
      })
    )) as Record<string, unknown>;

    expect(out).toEqual({ id: 1, raw: true });
    expect(resourceRequests()[0].url).toBe('https://acme.coupahost.com/api/invoices/1');
  });
});

describe('close_purchase_order', () => {
  it('PUTs to the close endpoint', async () => {
    mockApi(() => ({ id: 3, status: 'closed' }));

    await closePurchaseOrder.run(context({ purchaseOrderId: 3 }));

    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe('https://acme.coupahost.com/api/purchase_orders/3/close');
  });
});

describe('get_supplier_sites_by_supplier', () => {
  it('GETs the supplier_sites and wraps them with a count', async () => {
    mockApi(() => [
      { id: 1, name: 'Site A', status: 'active' },
      { id: 2, name: 'Site B', status: 'active' },
    ]);

    const out = (await getSupplierSites.run(
      context({ supplierId: 77 })
    )) as { total_count: number; supplier_sites: Record<string, unknown>[] };

    expect(out.total_count).toBe(2);
    expect(out.supplier_sites[0]['supplier_name']).toBe('Site A');
    expect(resourceRequests()[0].url).toBe(
      'https://acme.coupahost.com/api/suppliers/77/supplier_sites'
    );
  });

  it('wraps a single (non-array) response into a list', async () => {
    mockApi(() => ({ id: 1, name: 'Solo', status: 'active' }));

    const out = (await getSupplierSites.run(
      context({ supplierId: 77 })
    )) as { total_count: number };

    expect(out.total_count).toBe(1);
  });
});

describe('add_file_attachment_to_object', () => {
  it('uploads a file as multipart/form-data to the attachments endpoint', async () => {
    mockApi(() => ({ id: 1, 'attachment-type': 'file' }));

    await addFileAttachment.run(
      context({
        module: 'purchase_orders',
        parentRecord: { recordId: 8 },
        attachmentSource: 'file',
        attachment: {
          file: { data: Buffer.from('hello'), filename: 'spec.pdf' },
        },
        intent: undefined,
      })
    );

    const req = resourceRequests()[0];
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe('https://acme.coupahost.com/api/purchase_orders/8/attachments');
    expect(req.body).toBeInstanceOf(FormData);
  });

  it('attaches a URL link', async () => {
    mockApi(() => ({ id: 2, 'attachment-type': 'url' }));

    await addFileAttachment.run(
      context({
        module: 'contracts',
        parentRecord: { recordId: 5 },
        attachmentSource: 'url',
        attachment: { url: 'https://example.com/spec.pdf' },
        intent: 'Supplier',
      })
    );

    const req = resourceRequests()[0];
    expect(req.url).toBe('https://acme.coupahost.com/api/contracts/5/attachments');
    expect(req.body).toBeInstanceOf(FormData);
  });

  it('throws when the file is missing for a file upload', async () => {
    mockApi(() => ({}));

    await expect(
      addFileAttachment.run(
        context({
          module: 'suppliers',
          parentRecord: { recordId: 1 },
          attachmentSource: 'file',
          attachment: {},
          intent: undefined,
        })
      )
    ).rejects.toThrow('A file is required');
  });
});
