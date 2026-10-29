import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { linkedinCommon } from '.';

vi.mock('../..', () => ({ linkedinAuth: undefined }));

describe('linkedinCommon.getCompanies', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('pages through approved roles, keeps posting roles, dedupes and looks names up in chunks of 50', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      aclElement({ organizationId: index + 1, role: 'ADMINISTRATOR' })
    );
    const secondPage = [
      aclElement({ organizationId: 1, role: 'CONTENT_ADMINISTRATOR' }),
      aclElement({ organizationId: 101, role: 'ANALYST' }),
      aclElement({ organizationId: 102, role: 'DIRECT_SPONSORED_CONTENT_POSTER' }),
    ];
    const sendRequest = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(aclResponse(firstPage))
      .mockResolvedValueOnce(aclResponse(secondPage));
    const fetchMock = vi.fn(lookupResponse);
    vi.stubGlobal('fetch', fetchMock);

    const companies = await linkedinCommon.getCompanies('token');

    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls.map(([request]) => request.queryParams)).toEqual([
      { q: 'roleAssignee', state: 'APPROVED', start: '0', count: '100' },
      { q: 'roleAssignee', state: 'APPROVED', start: '100', count: '100' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(companies).toHaveLength(101);
    expect(companies.map((company) => company.id)).not.toContain(101);
    expect(companies).toContainEqual({ id: 102, localizedName: 'Page 102' });
  });

  it('returns no pages without a name lookup when the account has no posting role', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(
      aclResponse([aclElement({ organizationId: 7, role: 'ANALYST' })])
    );
    const fetchMock = vi.fn(lookupResponse);
    vi.stubGlobal('fetch', fetchMock);

    const companies = await linkedinCommon.getCompanies('token');

    expect(companies).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects when LinkedIn fails to list the roles', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new Error('request failed')
    );

    await expect(linkedinCommon.getCompanies('token')).rejects.toThrow(
      'request failed'
    );
  });

  it('rejects when the name lookup fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(
      aclResponse([aclElement({ organizationId: 7, role: 'ADMINISTRATOR' })])
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('denied', { status: 403 }))
    );

    await expect(linkedinCommon.getCompanies('token')).rejects.toThrow();
  });
});

function aclElement({
  organizationId,
  role,
}: {
  organizationId: number;
  role: string;
}) {
  return {
    organizationalTarget: `urn:li:organization:${organizationId}`,
    role,
    state: 'APPROVED',
  };
}

function aclResponse(elements: ReturnType<typeof aclElement>[]) {
  return { status: 200, headers: {}, body: { elements } };
}

async function lookupResponse(url: string | URL | Request): Promise<Response> {
  const match = /ids=List\(([^)]*)\)/.exec(String(url));
  const ids = match === null ? [] : match[1].split(',');
  const results = Object.fromEntries(
    ids.map((id) => [id, { id: Number(id), localizedName: `Page ${id}` }])
  );
  return new Response(JSON.stringify({ results }), { status: 200 });
}
