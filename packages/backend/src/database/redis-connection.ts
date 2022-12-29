import { createClient } from 'redis';
import { default as Redis } from "ioredis";

export const redisLockClient = createClient();
export const redisLock = require("redis-lock")(redisLockClient, 5000);
redisLockClient.on('error', (err) => console.log('Redis Client Error', err));

export const redisConnection = new Redis();
redisConnection.on('error', (err) => console.error('Redis Client Error', err));
