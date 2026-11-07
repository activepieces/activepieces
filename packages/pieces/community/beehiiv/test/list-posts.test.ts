import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listPostsAction } from '../src/lib/actions/list-posts.action';
import { runAction } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

const POSTS_URL = 'https://api.beehiiv.com/v2/publications/pub_1/posts';

const BASE_PROPS = { publicationId: 'pub_1', audience: 'all', platform: 'all', status: 'all' };

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function requestAt(index: number): { url: string; queryParams: Record<string, string> } {
    return sendRequest.mock.calls[index][0];
}

describe('beehiiv list posts', () => {
    beforeEach(() => {
        sendRequest.mockReset();
    });

    it('collects every page from the posts endpoint when no limit or page is set', async () => {
        respond({ data: [{ id: 'post_1' }], page: 1, limit: 100, total_results: 2, total_pages: 2 });
        respond({ data: [{ id: 'post_2' }], page: 2, limit: 100, total_results: 2, total_pages: 2 });

        const result = await runAction({ action: listPostsAction, propsValue: BASE_PROPS });

        expect(result).toEqual([{ id: 'post_1' }, { id: 'post_2' }]);
        expect(sendRequest).toHaveBeenCalledTimes(2);
        sendRequest.mock.calls.forEach(([request]) => {
            expect(request.url).toBe(POSTS_URL);
            expect(request.url).not.toContain('/automations');
        });
        expect(requestAt(0).queryParams.page).toBe('1');
        expect(requestAt(1).queryParams.page).toBe('2');
    });

    it('requests a single page from the posts endpoint when a limit is set', async () => {
        respond({ data: [{ id: 'post_1' }], page: 1, limit: 5, total_results: 1, total_pages: 1 });

        const result = await runAction({ action: listPostsAction, propsValue: { ...BASE_PROPS, limit: 5 } });

        expect(result).toEqual([{ id: 'post_1' }]);
        expect(sendRequest).toHaveBeenCalledTimes(1);
        expect(requestAt(0).url).toBe(POSTS_URL);
        expect(requestAt(0).queryParams.limit).toBe('5');
    });

    it.each([[[]], [undefined]])('omits expand when it is %j', async (expand) => {
        respond({ data: [], page: 1, limit: 5, total_results: 0, total_pages: 1 });

        await runAction({ action: listPostsAction, propsValue: { ...BASE_PROPS, limit: 5, expand } });

        expect(requestAt(0).queryParams).not.toHaveProperty('expand');
    });

    it('joins selected expand values with commas', async () => {
        respond({ data: [], page: 1, limit: 5, total_results: 0, total_pages: 1 });

        await runAction({
            action: listPostsAction,
            propsValue: { ...BASE_PROPS, limit: 5, expand: ['stats', 'free_web_content'] },
        });

        expect(requestAt(0).queryParams.expand).toBe('stats,free_web_content');
    });
});
