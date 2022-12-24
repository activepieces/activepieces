import { createClient } from 'redis';

export const redisClient = createClient();
export const redisLock = require("redis-lock")(redisClient, 5000);
redisClient.on('error', (err) => console.log('Redis Client Error', err));
