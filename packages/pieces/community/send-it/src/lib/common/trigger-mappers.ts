import { SendItRecord, isRecord } from './client';

export const triggerMappers = { published, failed, scheduled };

function dataOf(body: SendItRecord): SendItRecord {
  return isRecord(body['data']) ? body['data'] : {};
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function base(body: SendItRecord): SendItRecord {
  const content = dataOf(body)['content'];
  return {
    delivery_id: textOf(body['deliveryId']),
    event: textOf(body['event']),
    timestamp: textOf(body['timestamp']),
    content_text: isRecord(content) ? textOf(content['text']) : null,
  };
}

function published(body: SendItRecord): SendItRecord {
  const data = dataOf(body);
  return { ...base(body), platform: textOf(data['platform']), post_id: textOf(data['postId']), post_url: textOf(data['postUrl']), published_at: textOf(data['publishedAt']) };
}

function failed(body: SendItRecord): SendItRecord {
  const data = dataOf(body);
  return { ...base(body), platform: textOf(data['platform']), error: textOf(data['error']), failed_at: textOf(data['failedAt']) };
}

function scheduled(body: SendItRecord): SendItRecord {
  const data = dataOf(body);
  return {
    ...base(body),
    schedule_id: textOf(data['scheduleId']),
    platforms: Array.isArray(data['platforms']) ? data['platforms'].map(String).join(', ') : null,
    scheduled_time: textOf(data['scheduledTime']),
  };
}
