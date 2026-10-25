import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { DiscourseCredentials, discourseRequest, isRecord } from './client';
import { discourseMap } from './mappers';

function failure(error: unknown) {
  const reason = error instanceof Error ? error.message : String(error);
  return {
    disabled: true,
    options: [],
    placeholder: `Could not load options from Discourse: ${reason}`.slice(0, 300),
  };
}

const notConnected = {
  disabled: true,
  options: [],
  placeholder: 'Connect your Discourse account first',
};

async function loadTopics(auth: DiscourseCredentials) {
  const pages = await collectPages({
    maxPages: MAX_TOPIC_PAGES,
    fetchPage: async (page) => {
      const body = await discourseRequest({ auth, method: HttpMethod.GET, path: '/latest.json', query: { page } });
      const topicList = discourseMap.rec(isRecord(body) ? body['topic_list'] : undefined);
      return {
        items: discourseMap.list(topicList['topics']).map(discourseMap.rec),
        hasMore: typeof topicList['more_topics_url'] === 'string',
      };
    },
  });
  return pages
    .filter((topic) => discourseMap.num(topic['id']) !== null)
    .map((topic) => ({ label: discourseMap.str(topic['title']) ?? String(topic['id']), value: Number(topic['id']) }));
}

async function loadCategories(auth: DiscourseCredentials) {
  const body = await discourseRequest({
    auth,
    method: HttpMethod.GET,
    path: '/categories.json',
    query: { include_subcategories: 'true' },
  });
  return flattenCategories(body).map((category) => ({
    label: category.label,
    value: category.id,
  }));
}

async function loadGroups(auth: DiscourseCredentials) {
  const groups = await collectPages({
    maxPages: MAX_GROUP_PAGES,
    fetchPage: async (page) => {
      const body = discourseMap.rec(
        await discourseRequest({ auth, method: HttpMethod.GET, path: '/groups.json', query: { page } }),
      );
      const items = discourseMap.list(body['groups']).map(discourseMap.rec);
      return { items, hasMore: items.length > 0 && typeof body['load_more_groups'] === 'string' };
    },
  });
  return groups
    .filter((group) => discourseMap.num(group['id']) !== null)
    .map((group) => ({
      label: discourseMap.str(group['display_name']) ?? discourseMap.str(group['name']) ?? String(group['id']),
      value: Number(group['id']),
    }));
}

async function loadTrustLevels(auth: DiscourseCredentials) {
  const body = discourseMap.rec(await discourseRequest({ auth, method: HttpMethod.GET, path: '/site.json' }));
  const levels = discourseMap.rec(body['trust_levels']);
  const options = Object.entries(levels)
    .map(([label, value]) => ({ label, value: discourseMap.num(value) }))
    .filter((option): option is { label: string; value: number } => option.value !== null);
  return options.length > 0 ? options : DEFAULT_TRUST_LEVELS;
}

function flattenCategories(body: unknown): { id: number; label: string }[] {
  const categories = discourseMap.list(discourseMap.rec(discourseMap.rec(body)['category_list'])['categories']);
  return categories.flatMap((raw) => {
    const category = discourseMap.rec(raw);
    const id = discourseMap.num(category['id']);
    const name = discourseMap.str(category['name']) ?? String(category['id']);
    const children = discourseMap.list(category['subcategory_list']).flatMap((childRaw) => {
      const child = discourseMap.rec(childRaw);
      const childId = discourseMap.num(child['id']);
      return childId === null ? [] : [{ id: childId, label: `${name} › ${discourseMap.str(child['name']) ?? childId}` }];
    });
    return id === null ? children : [{ id, label: name }, ...children];
  });
}

async function collectPages({
  maxPages,
  fetchPage,
}: {
  maxPages: number;
  fetchPage: (page: number) => Promise<{ items: Record<string, unknown>[]; hasMore: boolean }>;
}): Promise<Record<string, unknown>[]> {
  const seen = new Set<string>();
  const collected: Record<string, unknown>[] = [];
  for (let page = 0; page < maxPages; page++) {
    const result = await fetchPage(page);
    const fresh = result.items.filter((item) => !seen.has(String(item['id'])));
    fresh.forEach((item) => seen.add(String(item['id'])));
    collected.push(...fresh);
    if (!result.hasMore || fresh.length === 0) {
      break;
    }
  }
  return collected;
}

function topicDropdown() {
  return Property.Dropdown({
    auth: discourseAuth,
    description: 'Topic to post in. Lists the most recently active topics.',
    displayName: 'Topic ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return notConnected;
      }
      try {
        return { disabled: false, options: await loadTopics(auth.props) };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

function categoryDropdown() {
  return Property.Dropdown({
    auth: discourseAuth,
    description: 'Category to post in, including subcategories.',
    displayName: 'Category ID',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return notConnected;
      }
      try {
        return { disabled: false, options: await loadCategories(auth.props) };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

function groupDropdown() {
  return Property.Dropdown({
    auth: discourseAuth,
    description: 'Group to add the users to.',
    displayName: 'Group Id',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return notConnected;
      }
      try {
        return { disabled: false, options: await loadGroups(auth.props) };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

function trustLevelDropdown() {
  return Property.Dropdown({
    auth: discourseAuth,
    description: 'New trust level of the user',
    displayName: 'New Trust Level',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return notConnected;
      }
      try {
        return { disabled: false, options: await loadTrustLevels(auth.props) };
      } catch (error) {
        return failure(error);
      }
    },
  });
}

export const discourseProps = {
  topicDropdown,
  categoryDropdown,
  groupDropdown,
  trustLevelDropdown,
  flattenCategories,
};

export const DEFAULT_TRUST_LEVELS = [
  { label: '0 - New user', value: 0 },
  { label: '1 - Basic user', value: 1 },
  { label: '2 - Member', value: 2 },
  { label: '3 - Regular', value: 3 },
  { label: '4 - Leader', value: 4 },
];

const MAX_TOPIC_PAGES = 5;
const MAX_GROUP_PAGES = 20;
