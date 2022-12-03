package com.activepieces.common.error.exception;

public class ActionExecutionException extends Exception {

  public ActionExecutionException(Exception e) {
    super("ActionExecutionException",e);
  }
}
