package com.activepieces.lockservice;

import java.time.Duration;

public interface LockService {
  String acquire(String key, Duration expiration);

  String waitUntilAcquire(String key, Duration expiration, Duration timeout) throws CannotAcquireLockException;

  boolean release(String key, String token);

}
