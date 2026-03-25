import { AtpAgent } from '@atproto/api';
import { BlueSkyAuthType } from './auth';

const agentCache = new Map<string, { agent: AtpAgent; expires: number }>();

export async function createBlueskyAgent(auth: BlueSkyAuthType): Promise<AtpAgent> {
  const cacheKey = `${auth.identifier}:${auth.pdsHost || 'https://bsky.social'}`;
  const cached = agentCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expires) {
    return cached.agent;
  }

  try {
    const agent = new AtpAgent({
      service: auth.pdsHost || 'https://bsky.social',
    });

    await agent.login({
      identifier: auth.identifier,
      password: auth.password,
    });

    agentCache.set(cacheKey, {
      agent,
      expires: Date.now() + 50 * 60 * 1000,
    });

    return agent;
  } catch (error: any) {
    agentCache.delete(cacheKey);
    throw new Error(`Failed to create Bluesky agent: ${error.message || 'Unknown error'}`);
  }
}

export async function getCurrentSession(auth: BlueSkyAuthType) {
  const agent = await createBlueskyAgent(auth);
  return {
    did: agent.session?.did,
    handle: agent.session?.handle,
  };
}
