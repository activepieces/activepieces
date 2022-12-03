package com.activepieces.common.errorhandling;

import com.activepieces.authentication.client.exception.InvalidTokenException;
import com.activepieces.authentication.client.exception.UnAuthenticationException;
import com.activepieces.authentication.client.exception.UnAuthorizedException;
import com.activepieces.authentication.client.exception.UserNotFoundException;
import com.activepieces.common.error.ErrorCode;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.common.error.exception.*;
import com.activepieces.common.error.exception.collection.CollectionInvalidStateException;
import com.activepieces.common.error.exception.collection.CollectionNotFoundException;
import com.activepieces.common.error.exception.collection.CollectionVersionAlreadyLockedException;
import com.activepieces.common.error.exception.collection.CollectionVersionNotFoundException;
import com.activepieces.common.error.exception.flow.FlowNotFoundException;
import com.activepieces.common.error.exception.flow.FlowVersionAlreadyLockedException;
import com.activepieces.common.error.exception.flow.FlowVersionNotFoundException;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.logging.client.exception.InstanceRunNotFoundException;
import com.activepieces.project.client.exception.ProjectNotFoundException;
import com.activepieces.security.Slf4jMDCFilterConfiguration;
import com.activepieces.variable.model.exception.MissingConfigsException;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Hidden
@RestControllerAdvice
public class ExceptionHandlerController {

  @Autowired
  public ExceptionHandlerController() {

  }

  @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
  public ResponseEntity exception(HttpRequestMethodNotSupportedException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = CollectionInvalidStateException.class)
  public ResponseEntity exception(CollectionInvalidStateException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = ConfigNotDynamicException.class)
  public ResponseEntity exception(ConfigNotDynamicException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = HttpMediaTypeNotSupportedException.class)
  public ResponseEntity exception(HttpMediaTypeNotSupportedException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.BAD_REQUEST);
  }


  @ExceptionHandler(value = ConfigInvalidTypeException.class)
  public ResponseEntity exception(ConfigInvalidTypeException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler({MethodArgumentTypeMismatchException.class})
  public ResponseEntity<Object> handleMethodArgumentTypeMismatch(
      MethodArgumentTypeMismatchException ex, WebRequest request) {
    String error = ex.getName() + " should be of type " + ex.getRequiredType().getName();
    return new ResponseEntity<Object>(error, new HttpHeaders(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = ConfigNotFoundException.class)
  public ResponseEntity exception(ConfigNotFoundException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = IllegalArgumentException.class)
  public ResponseEntity exception(IllegalArgumentException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity handleAllOtherErrors(HttpMessageNotReadableException formatException) {
    String error = formatException.getMessage();
    return new ResponseEntity(error, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = InstantiationException.class)
  public ResponseEntity<ErrorResponse> exception(InstantiationException exception) {
    return new ResponseEntity<>(
        new ErrorResponse("Internal Server error :(", ErrorCode.INTERNAL_SERVER_ERROR),
        HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(value = CodeArtifactBuildFailure.class)
  public ResponseEntity<ErrorResponse> exception(CodeArtifactBuildFailure exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = InvalidImageFormatException.class)
  public ResponseEntity<ErrorResponse> exception(InvalidImageFormatException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = ConstraintsException.class)
  public ResponseEntity<Set<ErrorResponse>> exception(ConstraintsException exception) {
    return new ResponseEntity<>(exception.getErrorResponse(), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = CollectionVersionAlreadyLockedException.class)
  public ResponseEntity<ErrorResponse> exception(
      CollectionVersionAlreadyLockedException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = InvalidTokenException.class)
  public ResponseEntity<ErrorResponse> exception(InvalidTokenException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(value = MissingConfigsException.class)
  public ResponseEntity<ErrorResponse> exception(MissingConfigsException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = InstanceRunNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(InstanceRunNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = CollectionVersionNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(CollectionVersionNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = ApiKeyNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(ApiKeyNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = ManifestNotFoundException.class)
  public ResponseEntity exception(ManifestNotFoundException exception) {
    return new ResponseEntity<>(exception.getMessage(), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = InstanceNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(InstanceNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = FlowVersionNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(FlowVersionNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = FlowNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(FlowNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = CollectionNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(CollectionNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = ProjectNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(ProjectNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = UserNotFoundException.class)
  public ResponseEntity<ErrorResponse> exception(UserNotFoundException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.NOT_FOUND);
  }

  @ExceptionHandler(value = FlowVersionAlreadyLockedException.class)
  public ResponseEntity<ErrorResponse> exception(FlowVersionAlreadyLockedException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = InvalidCodeArtifactException.class)
  public ResponseEntity<ErrorResponse> exception(InvalidCodeArtifactException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = FlowNotEnabledException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<ErrorResponse> exception(FlowNotEnabledException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(value = PermissionDeniedException.class)
  public ResponseEntity<ErrorResponse> exception(PermissionDeniedException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.FORBIDDEN);
  }

  @ExceptionHandler(value = UnAuthenticationException.class)
  public ResponseEntity<ErrorResponse> exception(UnAuthenticationException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(value = UnAuthorizedException.class)
  public ResponseEntity<ErrorResponse> exception(UnAuthorizedException exception) {
    return new ResponseEntity<>(new ErrorResponse(exception), HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ResponseEntity<ErrorResponse> handleAllUncaughtException(
      Exception exception, WebRequest request) {
    exception.printStackTrace();
    return new ResponseEntity<>(
        ErrorResponse.builder()
            .errorCode(ErrorCode.INTERNAL_SERVER_ERROR)
            .message(
                "Unknown error occurred Request-id: "
                    + request.getHeader(Slf4jMDCFilterConfiguration.DEFAULT_RESPONSE_TOKEN_HEADER)
                    + ", "
                    + exception.getMessage())
            .build(),
        HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(
            error -> {
              if (errors.containsKey(error.getField())) {
                errors.put(
                    error.getField(),
                    String.format(
                        "%s, %s", errors.get(error.getField()), error.getDefaultMessage()));
              } else {
                errors.put(error.getField(), error.getDefaultMessage());
              }
            });
    return ResponseEntity.badRequest().body(errors);
  }
}
