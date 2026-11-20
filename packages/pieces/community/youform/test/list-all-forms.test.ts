import { HttpMethod } from '@activepieces/pieces-common';
import {
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  PropertyContext,
} from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { youformApi } from '../src/lib/common/api';
import { youformClient } from '../src/lib/common/client';
import { youformProps } from '../src/lib/common/props';
import type {
  YouformAuthValue,
  YouformForm,
  YouformPage,
} from '../src/lib/common/types';

const AUTH: YouformAuthValue = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'token',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listAllForms', () => {
  test('combines two pages in order and keeps slugs', async () => {
    const request = mockPages({
      pages: [
        pageOf({ forms: [form({ id: 1 }), form({ id: 2 })], current: 1, last: 2, hasNext: true }),
        pageOf({ forms: [form({ id: 3 })], current: 2, last: 2, hasNext: false }),
      ],
    });
    const forms = await youformApi.listAllForms({ auth: AUTH });
    expect(forms.map((item) => item.slug)).toEqual(['form-1', 'form-2', 'form-3']);
    expect(forms.map((item) => item.name)).toEqual(['Form 1', 'Form 2', 'Form 3']);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, path: '/forms', query: { page: '1' } });
    expect(request.mock.calls[1][0]).toMatchObject({ method: HttpMethod.GET, path: '/forms', query: { page: '2' } });
  });

  test('stops after page 1 when next_page_url is null', async () => {
    const request = mockPages({
      pages: [pageOf({ forms: [form({ id: 1 })], current: 1, last: 5, hasNext: false })],
    });
    const forms = await youformApi.listAllForms({ auth: AUTH });
    expect(forms).toHaveLength(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  test('stops when a page returns no forms', async () => {
    const request = mockPages({
      pages: [
        pageOf({ forms: [form({ id: 1 })], current: 1, last: 5, hasNext: true }),
        pageOf({ forms: [], current: 2, last: 5, hasNext: true }),
        pageOf({ forms: [form({ id: 9 })], current: 3, last: 5, hasNext: true }),
      ],
    });
    const forms = await youformApi.listAllForms({ auth: AUTH });
    expect(forms.map((item) => item.slug)).toEqual(['form-1']);
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('stops when page reaches last_page even though next_page_url is set', async () => {
    const request = mockPages({
      pages: [
        pageOf({ forms: [form({ id: 1 })], current: 1, last: 2, hasNext: true }),
        pageOf({ forms: [form({ id: 2 })], current: 2, last: 2, hasNext: true }),
        pageOf({ forms: [form({ id: 3 })], current: 3, last: 2, hasNext: true }),
      ],
    });
    const forms = await youformApi.listAllForms({ auth: AUTH });
    expect(forms).toHaveLength(2);
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('stops after page 1 when last_page is absent', async () => {
    const request = mockPages({
      pages: [
        pageOf({ forms: [form({ id: 1 })], current: 1, last: undefined, hasNext: true }),
        pageOf({ forms: [form({ id: 2 })], current: 2, last: undefined, hasNext: true }),
      ],
    });
    const forms = await youformApi.listAllForms({ auth: AUTH });
    expect(forms).toHaveLength(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  test('caps at 50 pages', async () => {
    const request = vi
      .spyOn(youformClient, 'request')
      .mockImplementation(async ({ query }) => {
        const page = Number(query?.['page']);
        return pageOf({ forms: [form({ id: page })], current: page, last: 999, hasNext: true });
      });
    const forms = await youformApi.listAllForms({ auth: AUTH });
    expect(request).toHaveBeenCalledTimes(50);
    expect(forms).toHaveLength(50);
  });

  test('rejects when a later request fails', async () => {
    const request = vi.spyOn(youformClient, 'request');
    request.mockResolvedValueOnce(
      pageOf({ forms: [form({ id: 1 })], current: 1, last: 3, hasNext: true }),
    );
    request.mockRejectedValueOnce(new Error('boom'));
    await expect(youformApi.listAllForms({ auth: AUTH })).rejects.toThrow('boom');
    expect(request).toHaveBeenCalledTimes(2);
  });
});

describe('Form dropdown', () => {
  test('is disabled without a connection', async () => {
    const request = vi.spyOn(youformClient, 'request');
    const state = await youformProps.formId({ required: true }).options({}, propertyContext());
    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Please connect your account first.',
    });
    expect(request).not.toHaveBeenCalled();
  });

  test('shows a placeholder for an account with no forms', async () => {
    mockPages({
      pages: [pageOf({ forms: [], current: 1, last: 1, hasNext: false })],
    });
    const state = await youformProps
      .formId({ required: true })
      .options({ auth: AUTH }, propertyContext());
    expect(state).toEqual({
      disabled: false,
      options: [],
      placeholder: 'No forms yet. Create one in Youform.',
    });
  });

  test('is disabled when a page fails to load', async () => {
    const request = vi.spyOn(youformClient, 'request');
    request.mockResolvedValueOnce(
      pageOf({ forms: [form({ id: 1 })], current: 1, last: 2, hasNext: true }),
    );
    request.mockRejectedValueOnce(new Error('boom'));
    const state = await youformProps
      .formId({ required: true })
      .options({ auth: AUTH }, propertyContext());
    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: "Couldn't load forms. Check connection.",
    });
  });

  test('lists form names as labels and slugs as values across pages', async () => {
    mockPages({
      pages: [
        pageOf({ forms: [form({ id: 1 })], current: 1, last: 2, hasNext: true }),
        pageOf({ forms: [form({ id: 2 })], current: 2, last: 2, hasNext: false }),
      ],
    });
    const state = await youformProps
      .formId({ required: true })
      .options({ auth: AUTH }, propertyContext());
    expect(state).toEqual({
      disabled: false,
      options: [
        { label: 'Form 1', value: 'form-1' },
        { label: 'Form 2', value: 'form-2' },
      ],
    });
  });
});

function form({ id }: { id: number }): YouformForm {
  return { id, name: `Form ${id}`, slug: `form-${id}` };
}

function pageOf({
  forms,
  current,
  last,
  hasNext,
}: {
  forms: YouformForm[];
  current: number;
  last: number | undefined;
  hasNext: boolean;
}): YouformPage<YouformForm> {
  return {
    data: {
      data: forms,
      current_page: current,
      last_page: last,
      next_page_url: hasNext ? `https://app.youform.com/api/forms?page=${current + 1}` : null,
    },
  };
}

function mockPages({ pages }: { pages: YouformPage<YouformForm>[] }) {
  const request = vi.spyOn(youformClient, 'request');
  pages.forEach((page) => request.mockResolvedValueOnce(page));
  return request;
}

function propertyContext(): PropertyContext {
  const { server, project, flows, connections } = createMockActionContext<InputPropertyMap>({
    propsValue: {},
  });
  return { server, project, flows, connections };
}
