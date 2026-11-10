/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { Template, TemplateType } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const officialTemplates = vi.hoisted(() => [
  { id: 't1', name: 'Slack alerts', categories: ['Sales'] },
  { id: 't2', name: 'Gmail digest', categories: ['Sales', 'Marketing'] },
  { id: 't3', name: 'Slack standup', categories: ['Marketing'] },
  { id: 't4', name: 'Uncategorized helper', categories: [] as string[] },
]);

const list = vi.hoisted(() =>
  vi.fn(
    async ({ search, category }: { search?: string; category?: string }) => ({
      data: officialTemplates.filter(
        (template) =>
          (!search ||
            template.name.toLowerCase().includes(search.toLowerCase())) &&
          (!category || template.categories.includes(category)),
      ),
    }),
  ),
);

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/templates', async () => {
  const { templatesHooks } = await import(
    '@/features/templates/hooks/templates-hook'
  );
  return { templatesHooks, templatesTelemetryApi: { sendEvent: vi.fn() } };
});
vi.mock('@/features/templates/api/templates-api', () => ({
  templatesApi: {
    list,
    getCategories: async () => ({ value: ['Sales', 'Marketing', 'Legal'] }),
  },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { manageTemplatesEnabled: false } },
    }),
  },
}));
vi.mock('@/features/flows', () => ({
  flowHooks: {
    useStartFromScratch: () => ({ mutate: vi.fn(), isPending: false }),
  },
}));
vi.mock('@/app/routes/templates/category-filter-carousel', () => ({
  CategoryFilterCarousel: () => null,
}));
vi.mock('@/app/routes/templates/all-categories-view', () => ({
  AllCategoriesView: ({
    categories,
    templatesByCategory,
  }: {
    categories: string[];
    templatesByCategory: Record<string, Template[]>;
  }) => (
    <>
      {categories.map((category) => (
        <div key={category} data-category={category}>
          {templatesByCategory[category]
            ?.map((template) => template.name)
            .join(',')}
        </div>
      ))}
    </>
  ),
}));
vi.mock('@/app/routes/templates/selected-category-view', () => ({
  SelectedCategoryView: ({ templates }: { templates: Template[] }) => (
    <div data-selected-category>
      {templates.map((template) => template.name).join(',')}
    </div>
  ),
}));

const { TemplatesPage } = await import('@/app/routes/templates');

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function renderPage(url: string) {
  const queryClient = new QueryClient();
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[url]}>
          <TemplatesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function shownByCategory(): Record<string, string> {
  return Object.fromEntries(
    Array.from(container.querySelectorAll('[data-category]')).map((element) => [
      element.getAttribute('data-category') ?? '',
      element.textContent ?? '',
    ]),
  );
}

function emptyStateTitle(): string | null | undefined {
  return container.querySelector('[data-slot="empty-title"]')?.textContent;
}

function shownInSelectedCategory(): string | null | undefined {
  return container.querySelector('[data-selected-category]')?.textContent;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  list.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('TemplatesPage search on the official gallery', () => {
  it('shows every official template under All when nothing is searched', async () => {
    await renderPage('/templates');
    expect(shownByCategory()).toEqual({
      Sales: 'Slack alerts,Gmail digest',
      Marketing: 'Gmail digest,Slack standup',
    });
  });

  it('shows only matching templates under All when a search term is typed', async () => {
    await renderPage('/templates?search=slack');
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ type: TemplateType.OFFICIAL, search: 'slack' }),
    );
    expect(shownByCategory()).toEqual({
      Sales: 'Slack alerts',
      Marketing: 'Slack standup',
    });
  });

  it('shows only matching templates inside a selected category', async () => {
    await renderPage('/templates?search=slack&category=Sales');
    expect(shownInSelectedCategory()).toBe('Slack alerts');
  });

  it('shows the whole category when nothing is searched', async () => {
    await renderPage('/templates?category=Sales');
    expect(shownInSelectedCategory()).toBe('Slack alerts,Gmail digest');
  });

  it('shows the empty state when the search only matches templates outside every category', async () => {
    await renderPage('/templates?search=uncategorized');
    expect(shownByCategory()).toEqual({});
    expect(emptyStateTitle()).toBe('No templates found');
  });
});
