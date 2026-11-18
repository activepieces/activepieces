import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { updateWordPressPost } from '../src/lib/actions/update-post.action';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('update_post categories and tags', () => {
  it('keeps the current categories and tags when both dropdowns were cleared', async () => {
    const sent = mockWordPress();

    await runUpdatePost({ changes: { categories: [], tags: [] } });

    expect(postUpdate({ sent })).toEqual({});
  });

  it('keeps the current categories and tags when both dropdowns were left untouched', async () => {
    const sent = mockWordPress();

    await runUpdatePost({ changes: { title: 'New title' } });

    expect(postUpdate({ sent })).toEqual({ title: 'New title' });
  });

  it('sends the categories and tags that were picked', async () => {
    const sent = mockWordPress();

    await runUpdatePost({ changes: { categories: ['3'], tags: ['5', '8'] } });

    expect(postUpdate({ sent })).toEqual({ categories: ['3'], tags: ['5', '8'] });
  });
});

function mockWordPress(): HttpRequest[] {
  const sent: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
    sent.push(request);
    return { status: 200, headers: {}, body: {} };
  });
  return sent;
}

function postUpdate({ sent }: { sent: HttpRequest[] }): unknown {
  const update = sent.find((request) => request.url === `${SITE}/wp-json/wp/v2/posts/${POST_ID}`);
  return update?.body;
}

function runUpdatePost({ changes }: { changes: Partial<UpdatePostPropsValue> }): Promise<unknown> {
  const propsValue: UpdatePostPropsValue = { ...UNTOUCHED_FORM, ...changes };
  return updateWordPressPost.run({
    ...createMockActionContext<UpdatePostProps>({ propsValue }),
    auth: {
      type: AppConnectionType.CUSTOM_AUTH,
      props: { username: 'editor', password: 'app-password', website_url: SITE },
    },
  });
}

const SITE = 'https://blog.example.com';

const POST_ID = 7;

const UNTOUCHED_FORM: UpdatePostPropsValue = {
  post: POST_ID,
  empty_fields_info: undefined,
  title: undefined,
  content: undefined,
  status: undefined,
  categories: undefined,
  tags: undefined,
  featured_media: undefined,
  featured_media_file: undefined,
  excerpt: undefined,
  date: undefined,
  slug: undefined,
  acfFields: undefined,
  comment_status: undefined,
  ping_status: undefined,
};

type UpdatePostProps = typeof updateWordPressPost.props;

type UpdatePostPropsValue = Parameters<typeof createMockActionContext<UpdatePostProps>>[0]['propsValue'];
