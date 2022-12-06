package com.activepieces.common.error.exception;

public class FailedToObtainLockException extends Exception {

  public FailedToObtainLockException(Exception e) {
    super("FailedToObtainLock",e);
  }
}
