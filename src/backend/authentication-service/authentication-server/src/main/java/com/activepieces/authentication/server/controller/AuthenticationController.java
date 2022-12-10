package com.activepieces.authentication.server.controller;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.exception.UnAuthenticationException;
import com.activepieces.authentication.client.exception.UnAuthorizedException;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignInRequest;
import com.activepieces.authentication.client.JWTService;
import com.activepieces.common.identity.UserIdentity;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Optional;

@CrossOrigin
@Log4j2
@RestController
@Hidden
@RequestMapping(path = "/authentication")
public class AuthenticationController {

  private final UserAuthenticationService userAuthenticationService;
  private final JWTService jwtService;

  @Autowired
  public AuthenticationController(
      @NonNull final UserAuthenticationService userAuthenticationService,
      @NonNull final JWTService jwtService) {
    this.jwtService = jwtService;
    this.userAuthenticationService = userAuthenticationService;
  }

  @ResponseBody
  @PostMapping(value = "/sign-in")
  public ResponseEntity<Object> signIn(@RequestBody @Valid final SignInRequest request)
      throws UnAuthorizedException, UnAuthenticationException {
    final Optional<UserInformationView> userInformation =
        userAuthenticationService.getByCredentials(request.getEmail(), request.getPassword());
    if(userInformation.isEmpty()){
      throw new UnAuthenticationException();
    }
    return ResponseEntity.ok()
        .header(
            JWTService.AUTHORIZATION_HEADER_NAME,
            jwtService.createTokenWithDefaultExpiration(
                UserIdentity.builder().resourceId(userInformation.get().getId()).build()))
        .body(userInformation.get());
  }

}
