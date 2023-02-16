import Redis from "ioredis";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";
import { createLock } from "@microfleet/ioredis-lock";

const username = system.get(SystemProp.REDIS_USER);
const password = system.get(SystemProp.REDIS_PASSWORD);
const useSsl = system.get(SystemProp.REDIS_USE_SSL)??false;
const host = system.getOrThrow(SystemProp.REDIS_HOST);
const serializedPort = system.getOrThrow(SystemProp.REDIS_PORT);
const port = Number.parseInt(serializedPort, 10);


export const createRedisClient = (): Redis => {
    return new Redis({
        host,
        port,
        username: username,
        password: password,
        maxRetriesPerRequest: null,
        tls: useSsl ? {} : undefined,
    });
};

const redisConection = createRedisClient();

export const createRedisLock = (key: string) => {
    return createLock(redisConection, {
        timeout: 2 * 60 * 1000,
        retries: 10,
        delay: 2000,
    }).acquire(key);
};
