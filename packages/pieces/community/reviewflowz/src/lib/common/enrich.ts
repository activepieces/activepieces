import { HttpMethod } from '@activepieces/pieces-common';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';

async function enrich({ auth, row }: { auth: ReviewflowzAuthValue; row: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const cache = new Map<string, Promise<Record<string, unknown> | null>>();
  const read = (path: string) => {
    const hit = cache.get(path);
    if (hit) {
      return hit;
    }
    const pending = fetchOne({ auth, path });
    cache.set(path, pending);
    return pending;
  };

  const event = isRecord(row['event']) ? row['event'] : {};
  const [source, location, campaign, contact, eventSource, eventCampaign] = await Promise.all([
    typeof row['source'] === 'string' ? read(`/sources/${row['source']}`) : null,
    typeof row['location'] === 'string' ? read(`/locations/${row['location']}`) : null,
    typeof row['campaign'] === 'string' ? read(`/campaigns/${row['campaign']}`) : null,
    typeof row['contact'] === 'string' ? read(`/contacts/${row['contact']}`) : null,
    typeof event['source'] === 'string' && typeof row['source'] !== 'string' ? read(`/sources/${event['source']}`) : null,
    typeof event['campaign'] === 'string' ? read(`/campaigns/${event['campaign']}`) : null,
  ]);

  return {
    ...row,
    ...(source ? { source_name: source['name'], source_url: source['url'] } : {}),
    ...(location ? { location_name: location['name'] } : {}),
    ...(campaign ? { campaign_name: campaign['name'] } : {}),
    ...(contact ? { contact } : {}),
    event: {
      ...event,
      ...(eventSource ? { source_name: eventSource['name'] } : {}),
      ...(eventCampaign ? { campaign_name: eventCampaign['name'] } : {}),
    },
  };
}

async function fetchOne({ auth, path }: { auth: ReviewflowzAuthValue; path: string }): Promise<Record<string, unknown> | null> {
  try {
    const response = await reviewflowzApi.send<Record<string, unknown>>({ auth, method: HttpMethod.GET, path });
    return response.ok && isRecord(response.body) ? response.body : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const reviewflowzEnrich = { enrich, isRecord };
