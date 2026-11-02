import { HttpMethod } from '@activepieces/pieces-common';
import { DiscourseCredentials, DiscourseQuery, discourseRequest } from './client';
import { discourseInput } from './input';
import { discourseMap } from './mappers';
import { discourseOps } from './operations';

async function topicPage({
  auth,
  path,
  page,
  query = {},
}: {
  auth: DiscourseCredentials;
  path: string;
  page: unknown;
  query?: DiscourseQuery;
}) {
  const pageNumber = discourseInput.boundedNumber({ value: page, label: 'Page', min: 0, max: 10000, fallback: 0 });
  const body = discourseMap.rec(
    await discourseRequest({ auth, method: HttpMethod.GET, path, query: { ...query, page: pageNumber } }),
  );
  const topicList = discourseMap.rec(body['topic_list']);
  const base = discourseOps.baseUrl(auth);
  const items = discourseMap.list(topicList['topics']).map((raw) => discourseMap.topicSummary({ raw, baseUrl: base }));
  const hasMore = typeof topicList['more_topics_url'] === 'string' && items.length > 0;
  return {
    items,
    count: items.length,
    page: pageNumber,
    next_page: hasMore ? pageNumber + 1 : null,
    has_more: hasMore,
  };
}

export const discourseLists = { topicPage };
