import { StreakBox, StreakTask } from './types';

export function flattenStreakBox(box: StreakBox) {
  return {
    box_key: box.boxKey ?? box.key,
    name: box.name,
    pipeline_key: box.pipelineKey,
    stage_key: box.stageKey ?? null,
    creator_key: box.creatorKey ?? null,
    notes: box.notes ?? null,
    follower_count: box.followerCount ?? null,
    comment_count: box.commentCount ?? null,
    task_total: box.taskTotal ?? null,
    file_count: box.fileCount ?? null,
    gmail_thread_count: box.gmailThreadCount ?? null,
    creation_timestamp: box.creationTimestamp ?? null,
    last_updated_timestamp: box.lastUpdatedTimestamp ?? null,
    followers: Array.isArray(box.followerKeys) ? box.followerKeys.join(', ') : null,
    fields_json:
      box.fields && Object.keys(box.fields).length > 0
        ? JSON.stringify(box.fields)
        : null,
  };
}

export function flattenStreakTask({
  task,
  fallbackBoxKey,
}: {
  task: StreakTask;
  fallbackBoxKey: string;
}) {
  return {
    task_key: task.key,
    box_key: task.boxKey ?? fallbackBoxKey,
    text: task.text,
    status: task.status ?? null,
    due_date_epoch_ms: task.dueDate ?? null,
    creator_key: task.creatorKey ?? null,
    creation_date_epoch_ms: task.creationDate ?? null,
    last_updated_date_epoch_ms: task.lastUpdatedDate ?? null,
    assigned_to_emails: Array.isArray(task.assignedToSharingEntries)
      ? task.assignedToSharingEntries
          .map((a) => a.email)
          .filter((e): e is string => Boolean(e))
          .join(', ')
      : null,
  };
}

export function toEmailList(values: unknown[] | undefined): string[] {
  return (values ?? []).filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  );
}
