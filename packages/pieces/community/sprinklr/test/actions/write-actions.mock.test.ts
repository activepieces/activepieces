import { createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, expect, it, vi } from 'vitest';
import { addCaseCommentAction } from '../../src/lib/actions/add-case-comment';
import { describeMock, MOCK_AUTH, routeToSprinklrMock, SPRINKLR_MOCK_BASE_URL } from '../support/sprinklr-mock';

function runAddComment(propsValue: Record<string, unknown>): Promise<unknown> {
  const context = { ...createMockActionContext({ propsValue }), auth: MOCK_AUTH };
  return addCaseCommentAction.run(context as never);
}

describeMock("Add Comment to Case against Sprinklr's public mock", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to /comment with the published field names and parses the answer', async () => {
    const route = routeToSprinklrMock();
    const output = await runAddComment({ case_number: '123', comment: 'hi', is_private: false });
    expect(route.requests).toHaveLength(1);
    expect(route.requests[0].method).toBe('POST');
    expect(route.requests[0].url).toBe(`${SPRINKLR_MOCK_BASE_URL}/comment`);
    expect(route.requests[0].body).toEqual({ entityType: 'CASE', entityId: '123', text: 'hi', isPrivate: false });
    expect(output).toMatchObject({ entityType: 'CASE', entityId: '123', text: 'hi' });
    expect(Object.keys(output as object).sort()).toEqual(['commentingUser', 'createdTime', 'entityId', 'entityType', 'id', 'text']);
    expect(typeof (output as { id: unknown }).id).toBe('string');
  });

  it('turns a call with no headers into the reconnect message', async () => {
    routeToSprinklrMock({ stripHeaders: true });
    await expect(runAddComment({ case_number: '123', comment: 'hi' })).rejects.toThrow('Sprinklr rejected the connection. Reconnect it.');
  });
});
