import { createRedisClient } from "../database/redis-connection";

const redis = createRedisClient();

const getKey = (keySuffix: string): string => {
  return `ACTIVEPIECES:SYSTEM_PROP:${keySuffix}`;
};

export const store = {
  async save(keySuffix: string, value: string): Promise<void> {
    const key = getKey(keySuffix);
    await redis.set(key, value);
  },

  async load(keySuffix: string): Promise<string | null> {
    const key = getKey(keySuffix);
    return await redis.get(key);
  },
};
