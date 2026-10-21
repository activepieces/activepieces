import { HttpMethod } from '@activepieces/pieces-common';
import {
  DiscourseApiError,
  DiscourseCredentials,
  discourseRawRequest,
  discourseRequest,
  headerValue,
  isSameInstanceUrl,
  normalizeBaseUrl,
} from './client';
import { discourseInput } from './input';
import { discourseMap } from './mappers';

function baseUrl(auth: DiscourseCredentials): string {
  return normalizeBaseUrl(auth.website_url);
}

function mapCreatedPost({ auth, body }: { auth: DiscourseCredentials; body: unknown }) {
  const base = baseUrl(auth);
  const post = discourseMap.post({ raw: body, baseUrl: base });
  const raw = discourseMap.rec(body);
  return {
    ...post,
    topic_url:
      post.topic_id === null ? null : `${base}/t/${encodeURIComponent(discourseMap.str(raw['topic_slug']) ?? 'topic')}/${post.topic_id}`,
  };
}

async function createPost({
  auth,
  topicId,
  raw,
  replyToPostNumber,
}: {
  auth: DiscourseCredentials;
  topicId: unknown;
  raw: unknown;
  replyToPostNumber?: unknown;
}) {
  const body = await discourseRequest({
    auth,
    method: HttpMethod.POST,
    path: '/posts.json',
    body: {
      topic_id: Number(discourseInput.id({ value: topicId, label: 'Topic ID' })),
      raw: discourseInput.markdown({ value: raw, label: 'Post Content' }),
      ...optionalNumberField({
        key: 'reply_to_post_number',
        value: discourseInput.optionalId({ value: replyToPostNumber, label: 'Reply To Post Number' }),
      }),
    },
  });
  return mapCreatedPost({ auth, body });
}

async function findTopicByExternalId({
  auth,
  externalId,
}: {
  auth: DiscourseCredentials;
  externalId: string;
}): Promise<Record<string, unknown> | null> {
  const segment = discourseInput.name({ value: externalId, label: 'External ID' });
  try {
    const response = await discourseRawRequest({
      auth,
      method: HttpMethod.GET,
      path: `/t/external_id/${segment}.json`,
    });
    if (response.status >= 300 && response.status < 400) {
      const location = headerValue({ headers: response.headers, name: 'location' });
      const base = baseUrl(auth);
      if (location === undefined || !isSameInstanceUrl({ baseUrl: base, candidate: location })) {
        throw new DiscourseApiError({
          message: 'Discourse redirected the external ID lookup to an unexpected address, which was not followed.',
          status: response.status,
          responseBody: null,
        });
      }
      const match = /\/t\/(?:[^/]+\/)?(\d+)(?:\.json)?(?:\/\d+)?(?:[?#].*)?$/.exec(new URL(location, `${base}/`).pathname);
      if (match === null) {
        throw new DiscourseApiError({
          message: 'Discourse redirected the external ID lookup to an address without a topic ID.',
          status: response.status,
          responseBody: null,
        });
      }
      return discourseMap.rec(
        await discourseRequest({ auth, method: HttpMethod.GET, path: `/t/${match[1]}.json` }),
      );
    }
    return discourseMap.rec(response.body);
  } catch (error) {
    if (error instanceof DiscourseApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function createTopic({
  auth,
  title,
  raw,
  categoryId,
  tags,
  externalId,
}: {
  auth: DiscourseCredentials;
  title: unknown;
  raw: unknown;
  categoryId: unknown;
  tags?: unknown;
  externalId?: unknown;
}) {
  const external = discourseInput.optionalText(externalId);
  if (external !== undefined) {
    const existing = await findTopicByExternalId({ auth, externalId: external });
    if (existing !== null) {
      const base = baseUrl(auth);
      const firstPost = discourseMap.rec(discourseMap.list(discourseMap.rec(existing['post_stream'])['posts'])[0]);
      const mapped = discourseMap.post({
        raw: { ...firstPost, topic_id: existing['id'], topic_slug: existing['slug'], topic_title: existing['title'] },
        baseUrl: base,
      });
      return {
        ...mapped,
        topic_url: discourseMap.topicSummary({ raw: existing, baseUrl: base }).url,
        already_existed: true,
      };
    }
  }
  const tagList = discourseInput.stringList({ value: tags, label: 'Tags', required: false });
  const category = discourseInput.optionalId({ value: categoryId, label: 'Category ID' });
  const body = await discourseRequest({
    auth,
    method: HttpMethod.POST,
    path: '/posts.json',
    body: {
      title: discourseInput.text({ value: title, label: 'Title' }),
      raw: discourseInput.markdown({ value: raw, label: 'Content' }),
      ...optionalNumberField({ key: 'category', value: category }),
      ...(tagList.length > 0 ? { tags: tagList } : {}),
      ...(external !== undefined ? { external_id: external } : {}),
    },
  });
  return { ...mapCreatedPost({ auth, body }), already_existed: false };
}

async function setTrustLevel({ auth, userId, level }: { auth: DiscourseCredentials; userId: unknown; level: unknown }) {
  const id = discourseInput.id({ value: userId, label: 'User ID' });
  const trustLevel = discourseInput.boundedNumber({ value: level, label: 'Trust Level', min: 0, max: 4, fallback: -1 });
  if (trustLevel < 0) {
    throw new Error('Trust Level is required (0 to 4).');
  }
  const body = discourseMap.rec(
    await discourseRequest({
      auth,
      method: HttpMethod.PUT,
      path: `/admin/users/${id}/trust_level.json`,
      body: { level: trustLevel },
    }),
  );
  const adminUser = discourseMap.rec(body['admin_user']);
  return {
    user_id: Number(id),
    trust_level: discourseMap.num(adminUser['trust_level']) ?? trustLevel,
    username: discourseMap.str(adminUser['username']),
  };
}

async function changeGroupMembers({
  auth,
  groupId,
  usernames,
  remove,
}: {
  auth: DiscourseCredentials;
  groupId: unknown;
  usernames: unknown;
  remove: boolean;
}) {
  const id = discourseInput.id({ value: groupId, label: 'Group ID' });
  const requested = discourseInput.stringList({ value: usernames, label: 'Usernames', required: true });
  try {
    const body = discourseMap.rec(
      await discourseRequest({
        auth,
        method: remove ? HttpMethod.DELETE : HttpMethod.PUT,
        path: `/groups/${id}/members.json`,
        body: { usernames: requested.join(',') },
      }),
    );
    const changed = discourseMap.list(body['usernames']).map((name) => String(name));
    const changedLower = new Set(changed.map((name) => name.toLowerCase()));
    const reportedSkipped = discourseMap.list(body['skipped_usernames']).map((name) => String(name));
    const skipped =
      reportedSkipped.length > 0 ? reportedSkipped : requested.filter((name) => !changedLower.has(name.toLowerCase()));
    return {
      group_id: Number(id),
      success: true,
      usernames: changed.join(', '),
      skipped_usernames: skipped.join(', '),
      emails: discourseMap.list(body['emails']).map((email) => String(email)).join(', '),
    };
  } catch (error) {
    if (!remove && error instanceof DiscourseApiError && error.status === 422 && /already/i.test(error.message)) {
      return {
        group_id: Number(id),
        success: true,
        usernames: '',
        skipped_usernames: requested.join(', '),
        emails: '',
      };
    }
    throw error;
  }
}

async function sendPrivateMessage({
  auth,
  title,
  raw,
  recipients,
  groups,
}: {
  auth: DiscourseCredentials;
  title: unknown;
  raw: unknown;
  recipients: unknown;
  groups?: unknown;
}) {
  const users = discourseInput.stringList({ value: recipients, label: 'Users', required: false });
  const groupNames = discourseInput.stringList({ value: groups, label: 'Groups', required: false });
  if (users.length === 0 && groupNames.length === 0) {
    throw new Error('Add at least one recipient username or group name.');
  }
  const body = await discourseRequest({
    auth,
    method: HttpMethod.POST,
    path: '/posts.json',
    body: {
      title: discourseInput.text({ value: title, label: 'Title' }),
      raw: discourseInput.markdown({ value: raw, label: 'Content' }),
      archetype: 'private_message',
      ...(users.length > 0 ? { target_recipients: users.join(',') } : {}),
      ...(groupNames.length > 0 ? { target_group_names: groupNames.join(',') } : {}),
    },
  });
  return mapCreatedPost({ auth, body });
}

function optionalNumberField({ key, value }: { key: string; value: string | undefined }): Record<string, number> {
  return value === undefined ? {} : { [key]: Number(value) };
}

export const discourseOps = {
  baseUrl,
  createPost,
  createTopic,
  findTopicByExternalId,
  setTrustLevel,
  changeGroupMembers,
  sendPrivateMessage,
  mapCreatedPost,
};
