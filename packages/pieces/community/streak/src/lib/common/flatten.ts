import { StreakBox } from './types';

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
