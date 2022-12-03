package com.activepieces.lockservice;

import java.time.Duration;

public class CannotAcquireLockException extends Exception {

  public CannotAcquireLockException(String key, Duration timeout) {
    super(String.format("Timed out and couldn't acquire lock %s and timeout duration in seconds is %s", key.toString(), timeout.getSeconds()));
  }

}
