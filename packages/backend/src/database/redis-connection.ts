import { createClient } from "redis";
import Redis from "ioredis";
import createRedisLock from "redis-lock";

export const redisLockClient = createClient();
export const redisLock = createRedisLock(redisLockClient, 5000);
redisLockClient.on("error", (err: unknown) => console.log("Redis Client Error", err));

export const redisConnection = new Redis(6379, {
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err: unknown) => console.error("Redis Client Error", err));
