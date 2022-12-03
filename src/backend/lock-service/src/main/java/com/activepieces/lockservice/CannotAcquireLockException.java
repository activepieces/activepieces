package com.activepieces.lockservice;

import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponseException;

import java.time.Duration;
import java.util.UUID;

public class CannotAcquireLockException extends Exception {

  public CannotAcquireLockException(String key, Duration timeout) {
    super(String.format("Timed out and couldn't acquire lock %s and timeout duration in seconds is %s", key.toString(), timeout.getSeconds()));
  }

}
