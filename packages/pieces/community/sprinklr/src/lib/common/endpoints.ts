const API_VERSION = 'v3';

const SEARCH_ENTITY = {
  CASE: 'case',
  PROFILE: 'profile',
} as const;

const SEARCH_CURSOR_PARAMS = ['id', 'cursor'] as const;

function search(entity: SearchEntity): string {
  return `/search/${entity}`;
}

export const sprinklrEndpoints = {
  API_VERSION,
  SEARCH_ENTITY,
  SEARCH_CURSOR_PARAMS,
  ME: '/me',
  CASE: '/case',
  COMMENT: '/comment',
  PROFILE: '/profile',
  REPORTS_QUERY: '/reports/query',
  search,
};

export type SearchEntity = (typeof SEARCH_ENTITY)[keyof typeof SEARCH_ENTITY];
