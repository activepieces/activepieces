import { createClient } from "redis";
import Redis from "ioredis";
import createRedisLock from "redis-lock";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";

export const redisLockClient = createClient();
export const redisLock = createRedisLock(redisLockClient, 5000);
redisLockClient.on("error", (err: unknown) => console.log("Redis Client Error", err));

export const createRedisClient = (): Redis => {
  const host = system.getOrThrow(SystemProp.REDIS_HOST);
  const serializedPort = system.getOrThrow(SystemProp.REDIS_PORT);
  const port = Number.parseInt(serializedPort, 10);

  return new Redis({
    host,
    port,
    maxRetriesPerRequest: null,
  });
};
