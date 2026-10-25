import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFileAction } from '../src/lib/actions/get-file';
import { getFileOutlineAction } from '../src/lib/actions/get-file-outline';
import { getFileMetadataAction } from '../src/lib/actions/get-file-metadata';
import { getFileNodesAction } from '../src/lib/actions/get-file-nodes';
import { exportNodeImagesAction } from '../src/lib/actions/export-node-images';
import { listFileVersionsAction } from '../src/lib/actions/list-file-versions';
import { getCommentsAction } from '../src/lib/actions/get-comments';
import { postCommentAction } from '../src/lib/actions/post-comment';
import { deleteCommentAction } from '../src/lib/actions/delete-comment';
import { addCommentReactionAction, listCommentReactionsAction, removeCommentReactionAction } from '../src/lib/actions/comment-reactions';
import { listFileComponentsAction, listFileStylesAction } from '../src/lib/actions/library-content';
import { getCurrentUserAction } from '../src/lib/actions/get-current-user';
import { mockRoutes, runAction } from './helpers';

const KEY = 'HMvFQs5gIn9vdRYGCwgF9O';
const URL_WITH_NODE = `https://www.figma.com/design/${KEY}/AP-Figma-test?node-id=3-2`;

afterEach(() => vi.restoreAllMocks());

describe('Get File (human)', () => {
  it('accepts a URL, sends depth/ids/version and keeps the wrapper', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}`, body: { name: 'AP Figma test' } }]);
    const out = await runAction({ action: getFileAction, props: { file_key: URL_WITH_NODE, depth: 2, ids: ['3-2', '4:5'], version: ' 99 ', branch_data: true } });
    expect(calls[0].url).toBe(`https://api.figma.com/v1/files/${KEY}`);
    expect(calls[0].query).toEqual({ depth: '2', ids: '3:2,4:5', version: '99', branch_data: 'true' });
    expect(calls[0].headers['Authorization']).toBe('Bearer figma-token');
    expect(out).toEqual({ success: true, request_body: undefined, response_body: { name: 'AP Figma test' } });
    expect(getFileAction.audience).toBe('human');
  });
  it('rejects a lookalike host before any request', async () => {
    const calls = mockRoutes([]);
    await expect(runAction({ action: getFileAction, props: { file_key: `https://www.figma.com.evil.io/design/${KEY}/x` } })).rejects.toThrow('not a Figma file URL');
    await expect(runAction({ action: getFileAction, props: { file_key: `http://www.figma.com/design/${KEY}/x` } })).rejects.toThrow('not a Figma file URL');
    expect(calls).toHaveLength(0);
  });
  it('uses the branch key from a branch URL', async () => {
    const calls = mockRoutes([{ method: 'GET', path: '/v1/files/BRANCHKEY1', body: {} }]);
    await runAction({ action: getFileAction, props: { file_key: `https://www.figma.com/design/${KEY}/branch/BRANCHKEY1/x` } });
    expect(calls[0].url).toContain('/v1/files/BRANCHKEY1');
  });
});

describe('Get File Outline (ai)', () => {
  it('trims the tree to id/name/type at the requested depth', async () => {
    const calls = mockRoutes([{
      method: 'GET',
      path: `/v1/files/${KEY}`,
      body: { name: 'F', lastModified: 't', version: 'v', document: { children: [{ id: '0:1', name: 'Page 1', type: 'CANVAS', fills: [], children: [{ id: '3:2', name: 'Frame', type: 'FRAME', children: [{ id: '3:3' }] }] }] } },
    }]);
    const out = await runAction({ action: getFileOutlineAction, props: { file_key: KEY } });
    expect(calls[0].query).toEqual({ depth: '2' });
    expect(out.pages).toEqual([{ id: '0:1', name: 'Page 1', type: 'CANVAS', children: [{ id: '3:2', name: 'Frame', type: 'FRAME' }] }]);
    expect(getFileOutlineAction.audience).toBe('ai');
  });
  it('validates depth', async () => {
    mockRoutes([]);
    await expect(runAction({ action: getFileOutlineAction, props: { file_key: KEY, depth: 4 } })).rejects.toThrow('Depth must be');
  });
});

describe('Get File Metadata', () => {
  it('flattens body.file', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/meta`, body: { file: { name: 'F', url: 'https://www.figma.com/design/x' } } }]);
    expect(await runAction({ action: getFileMetadataAction, props: { file_key: KEY } })).toEqual({ fileKey: KEY, name: 'F', url: 'https://www.figma.com/design/x' });
    expect(calls).toHaveLength(1);
  });
});

describe('Get File Nodes', () => {
  it('returns a list with found flags', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/nodes`, body: { name: 'F', nodes: { '3:2': { document: { id: '3:2', name: 'Frame' } }, '9:9': null } } }]);
    const out = await runAction({ action: getFileNodesAction, props: { file_key: KEY, ids: ['3-2,9:9'], depth: '1' } });
    expect(calls[0].query).toEqual({ ids: '3:2,9:9', depth: '1' });
    expect(out.nodes).toEqual([
      { nodeId: '3:2', found: true, document: { id: '3:2', name: 'Frame' }, components: {}, styles: {} },
      { nodeId: '9:9', found: false, document: null },
    ]);
  });
  it('requires node ids', async () => {
    mockRoutes([]);
    await expect(runAction({ action: getFileNodesAction, props: { file_key: KEY, ids: [] } })).rejects.toThrow('Node IDs is required');
  });
});

describe('Export Node Images', () => {
  it('returns URLs and per-node errors', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/images/${KEY}`, body: { err: null, images: { '3:2': 'https://s3.example.com/a.png', '4:4': null } } }]);
    const out = await runAction({ action: exportNodeImagesAction, props: { file_key: KEY, ids: ['3:2', '4:4'], format: 'png', scale: 2 } });
    expect(calls[0].query).toEqual({ ids: '3:2,4:4', format: 'png', scale: '2' });
    expect(out.images[0]).toEqual({ nodeId: '3:2', url: 'https://s3.example.com/a.png', error: null });
    expect(out.images[1].url).toBeNull();
  });
  it('validates scale and format', async () => {
    mockRoutes([]);
    await expect(runAction({ action: exportNodeImagesAction, props: { file_key: KEY, ids: ['3:2'], scale: 5 } })).rejects.toThrow('Scale');
    await expect(runAction({ action: exportNodeImagesAction, props: { file_key: KEY, ids: ['3:2'], format: 'gif' } })).rejects.toThrow('Format');
  });
  it('downloads via stream without the Figma token', async () => {
    const calls = mockRoutes([
      { method: 'GET', path: `/v1/images/${KEY}`, body: { images: { '3:2': 'https://s3.example.com/a.png' } } },
      { method: 'GET', path: '/a.png', stream: Buffer.from('png-bytes') },
    ]);
    const write = vi.fn(async () => 'file-url');
    const base = await runAction({ action: exportNodeImagesAction, props: { file_key: KEY, ids: ['3:2'], download: true }, extra: { files: { write } } });
    expect(write).toHaveBeenCalledWith({ fileName: '3-2.png', data: Buffer.from('png-bytes') });
    expect(calls[1].headers['Authorization']).toBeUndefined();
    expect(calls[1].responseType).toBe('stream');
    expect(base.images[0]).toMatchObject({ file: 'file-url', size: 9 });
  });
});

describe('List File Versions', () => {
  it('pages with a same-origin cursor', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/versions`, body: { versions: [{ id: '1' }], pagination: { next_page: `https://api.figma.com/v1/files/${KEY}/versions?before=1` } } }]);
    const out = await runAction({ action: listFileVersionsAction, props: { file_key: KEY, limit: 10, cursor: '5' } });
    expect(calls[0].query).toEqual({ page_size: '10', before: '5' });
    expect(out).toEqual({ items: [{ id: '1' }], nextCursor: '1', hasMore: true });
  });
  it('ignores a next_page on another host', async () => {
    mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/versions`, body: { versions: [{ id: '1' }], pagination: { next_page: 'https://api.figma.com.evil.io/v1/x?before=1' } } }]);
    expect((await runAction({ action: listFileVersionsAction, props: { file_key: KEY } })).hasMore).toBe(false);
  });
  it('explains a missing scope on 403', async () => {
    mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/versions`, status: 403, body: { status: 403, err: 'Invalid scope' } }]);
    const error = await runAction({ action: listFileVersionsAction, props: { file_key: KEY } }).catch((e) => e);
    expect(error.message).toContain('reconnect the Figma connection so it grants the "file_versions:read" scope');
    expect(error.responseBody).toEqual({ status: 403, err: 'Invalid scope' });
    expect(error).not.toHaveProperty('body');
  });
});

describe('Get File Comments', () => {
  const comments = [
    { id: '1', created_at: '2026-10-01T00:00:00Z', resolved_at: null },
    { id: '2', created_at: '2026-10-20T00:00:00Z', resolved_at: '2026-10-21T00:00:00Z' },
    { id: '3', created_at: '2026-10-22T00:00:00Z', resolved_at: null },
  ];
  it('keeps the raw wrapper without filters', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/comments`, body: { comments } }]);
    expect(await runAction({ action: getCommentsAction, props: { file_key: KEY } })).toEqual({ success: true, request_body: undefined, response_body: { comments } });
    expect(calls[0].query).toEqual({});
  });
  it('filters unresolved and since', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/comments`, body: { comments } }]);
    const out = await runAction({ action: getCommentsAction, props: { file_key: KEY, as_md: true, unresolved_only: true, since: '2026-10-10T00:00:00Z' } });
    expect(calls[0].query).toEqual({ as_md: 'true' });
    expect(out.response_body.comments.map((c: { id: string }) => c.id)).toEqual(['3']);
  });
  it('explains 429', async () => {
    mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/comments`, status: 429, body: { status: 429, err: 'Rate limit exceeded' } }]);
    await expect(runAction({ action: getCommentsAction, props: { file_key: KEY } })).rejects.toThrow(/Retry-After.*Tier 2/);
  });
});

describe('Post File Comment', () => {
  it('posts a pinned comment', async () => {
    const calls = mockRoutes([{ method: 'POST', path: `/v1/files/${KEY}/comments`, body: { id: '7' } }]);
    const out = await runAction({ action: postCommentAction, props: { file_key: URL_WITH_NODE, message: 'hi', node_id: '3-2' } });
    expect(calls[0].body).toEqual({ message: 'hi', client_meta: { node_id: '3:2', node_offset: { x: 0, y: 0 } } });
    expect(calls[0].headers['Content-Type']).toBe('application/json');
    expect(out.response_body).toEqual({ id: '7' });
  });
  it('posts a reply and explains a reply-to-reply 400', async () => {
    const calls = mockRoutes([{ method: 'POST', path: `/v1/files/${KEY}/comments`, status: 400, body: { err: 'Cannot reply to a reply' } }]);
    await expect(runAction({ action: postCommentAction, props: { file_key: KEY, message: 'hi', comment_id: '5' } })).rejects.toThrow('top-level comment');
    expect(calls[0].body).toEqual({ message: 'hi', comment_id: '5' });
  });
  it('refuses reply + pin and empty messages', async () => {
    mockRoutes([]);
    await expect(runAction({ action: postCommentAction, props: { file_key: KEY, message: 'hi', comment_id: '5', node_id: '1:2' } })).rejects.toThrow('cannot be pinned');
    await expect(runAction({ action: postCommentAction, props: { file_key: KEY, message: '  ' } })).rejects.toThrow('Comment is required');
  });
});

describe('Delete Comment', () => {
  it('sends DELETE and returns the id', async () => {
    const calls = mockRoutes([{ method: 'DELETE', path: `/v1/files/${KEY}/comments/42` }]);
    expect(await runAction({ action: deleteCommentAction, props: { file_key: KEY, comment_id: ' 42 ' } })).toEqual({ deleted: true, fileKey: KEY, commentId: '42' });
    expect(calls).toHaveLength(1);
  });
  it('fails on 404', async () => {
    mockRoutes([{ method: 'DELETE', path: `/v1/files/${KEY}/comments/42`, status: 404, body: { err: 'Not found' } }]);
    await expect(runAction({ action: deleteCommentAction, props: { file_key: KEY, comment_id: '42' } })).rejects.toThrow('(404)');
  });
});

describe('Comment reactions', () => {
  it('lists with a cursor', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/comments/1/reactions`, body: { reactions: [{ emoji: ':heart:' }], pagination: { next_page: `https://api.figma.com/v1/files/${KEY}/comments/1/reactions?cursor=abc` } } }]);
    expect(await runAction({ action: listCommentReactionsAction, props: { file_key: KEY, comment_id: '1', cursor: 'x' } })).toEqual({ items: [{ emoji: ':heart:' }], nextCursor: 'abc', hasMore: true });
    expect(calls[0].query).toEqual({ cursor: 'x' });
  });
  it('adds and removes with a validated shortcode', async () => {
    const calls = mockRoutes([
      { method: 'POST', path: `/v1/files/${KEY}/comments/1/reactions` },
      { method: 'DELETE', path: `/v1/files/${KEY}/comments/1/reactions` },
    ]);
    expect(await runAction({ action: addCommentReactionAction, props: { file_key: KEY, comment_id: '1', emoji: 'heart' } })).toEqual({ added: true, fileKey: KEY, commentId: '1', emoji: ':heart:' });
    expect(calls[0].body).toEqual({ emoji: ':heart:' });
    expect(await runAction({ action: removeCommentReactionAction, props: { file_key: KEY, comment_id: '1', emoji: ':+1:' } })).toMatchObject({ removed: true, emoji: ':+1:' });
    expect(calls[1].query).toEqual({ emoji: ':+1:' });
    await expect(runAction({ action: addCommentReactionAction, props: { file_key: KEY, comment_id: '1', emoji: '❤️' } })).rejects.toThrow('shortcode');
  });
});

describe('Library content', () => {
  it('lists components of the main file even for a branch URL', async () => {
    const calls = mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/components`, body: { meta: { components: [{ key: 'a' }] } } }]);
    expect(await runAction({ action: listFileComponentsAction, props: { file_key: `https://www.figma.com/design/${KEY}/branch/BR1/x` } })).toEqual({ fileKey: KEY, items: [{ key: 'a' }], count: 1 });
    expect(calls).toHaveLength(1);
  });
  it('lists styles', async () => {
    mockRoutes([{ method: 'GET', path: `/v1/files/${KEY}/styles`, body: { meta: { styles: [] } } }]);
    expect(await runAction({ action: listFileStylesAction, props: { file_key: KEY } })).toEqual({ fileKey: KEY, items: [], count: 0 });
  });
});

describe('Get Current User', () => {
  it('returns the clean user', async () => {
    mockRoutes([{ method: 'GET', path: '/v1/me', body: { id: '1', handle: 'Odai', email: 'o@x.io', img_url: 'u', extra: 1 } }]);
    expect(await runAction({ action: getCurrentUserAction, props: {} })).toEqual({ id: '1', handle: 'Odai', email: 'o@x.io', img_url: 'u' });
  });
  it('explains 401', async () => {
    mockRoutes([{ method: 'GET', path: '/v1/me', status: 401, body: { err: 'Invalid token' } }]);
    await expect(runAction({ action: getCurrentUserAction, props: {} })).rejects.toThrow('Reconnect your Figma account');
  });
});

describe('error reason', () => {
  it('includes the Figma reason text', async () => {
    mockRoutes([{ method: 'GET', path: '/v1/me', status: 400, body: { error: true, status: 400, message: 'Access Denied', reason: 'Upgrade to professional team to enable webhooks' } }]);
    const error = await runAction({ action: getCurrentUserAction, props: {} }).catch((e) => e);
    expect(error.message).toContain('Access Denied: Upgrade to professional team to enable webhooks');
    expect(error.message).toContain('Professional or higher');
    expect(error.message).not.toContain('reconnect');
  });
});
