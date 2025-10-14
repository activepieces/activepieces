import { isNil } from '@activepieces/shared';
import { Mutex } from 'async-mutex';
import { FastifyBaseLogger } from 'fastify';
import Redis from 'ioredis';
import RedLock from 'redlock';

export const distributedLockFactory = (
  createRedisConnection: () => Promise<Redis>
) => {
  const lockMutex = new Mutex();
  let redLock: RedLock | undefined;

  const getOrCreateRedLock = async (): Promise<RedLock> => {
    return lockMutex.runExclusive(async () => {
      if (!isNil(redLock)) {
        return redLock;
      }
      const redisClient = await createRedisConnection();
      redLock = new RedLock([redisClient], {
        driftFactor: 0.01,
        retryCount: 30,
        automaticExtensionThreshold: 1000,
      });
      return redLock;
    });
  };

  return (_log: FastifyBaseLogger) => ({
    runExclusive: async <T>({
      key,
      timeoutInSeconds,
      fn,
    }: RunExclusiveParams<T>): Promise<T> => {
      const timeout = timeoutInSeconds * 1000;
      const redLockInstance = await getOrCreateRedLock();
      return await redLockInstance.using(
        [key],
        timeout,
        async () => await fn()
      );
    },
  });
};

type RunExclusiveParams<T> = {
  key: string;
  timeoutInSeconds: number;
  fn: () => Promise<T>;
};
