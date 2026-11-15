import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function groupId<R extends boolean>({
  required,
  displayName = 'Group ID',
  description = 'ID (GUID) of a Microsoft 365 group. Use List Groups to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function planId<R extends boolean>({
  required,
  displayName = 'Plan ID',
  description = 'Planner plan ID. Use List Plans to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function bucketId<R extends boolean>({
  required,
  displayName = 'Bucket ID',
  description = 'Planner bucket ID. Use List Buckets to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function taskId<R extends boolean>({
  required,
  displayName = 'Task ID',
  description = 'Planner task ID. Use List Plan Tasks, List Bucket Tasks or List My Tasks to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function userIds<R extends boolean>({
  required,
  displayName = 'User IDs',
  description = 'User IDs (GUIDs). Use List Group Members or Get Current User to find them.',
}: PropParams<R>) {
  return Property.Array({ displayName, description, required });
}

export const microsoft365PlannerAiProps = {
  groupId,
  planId,
  bucketId,
  taskId,
  userIds,
};
