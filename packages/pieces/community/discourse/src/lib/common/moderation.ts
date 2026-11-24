import { HttpMethod } from '@activepieces/pieces-common';
import { DiscourseCredentials, discourseRequest } from './client';
import { discourseInput } from './input';
import { discourseMap } from './mappers';

async function moderate({
  auth,
  userId,
  action,
  method,
  body,
  until,
  reason,
}: {
  auth: DiscourseCredentials;
  userId: unknown;
  action: string;
  method: HttpMethod;
  body?: Record<string, unknown>;
  until?: string;
  reason?: string;
}) {
  const id = discourseInput.id({ value: userId, label: 'User ID' });
  const response = discourseMap.rec(
    await discourseRequest({ auth, method, path: `/admin/users/${id}/${action}.json`, body }),
  );
  const detail = discourseMap.rec(response['suspension'] ?? response['silence']);
  return {
    user_id: Number(id),
    action,
    success: true,
    until: discourseMap.str(detail['suspended_till']) ?? discourseMap.str(detail['silenced_till']) ?? until ?? null,
    reason: discourseMap.str(detail['suspend_reason']) ?? discourseMap.str(detail['silence_reason']) ?? reason ?? null,
  };
}

export const discourseModeration = { moderate };
