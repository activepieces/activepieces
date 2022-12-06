package com.activepieces.lock;

import com.activepieces.common.error.exception.FailedToObtainLockException;

import java.time.Duration;
import java.util.concurrent.locks.Lock;

public interface LockService {
    Lock tryLock(String key, Duration timeout) throws FailedToObtainLockException;
}