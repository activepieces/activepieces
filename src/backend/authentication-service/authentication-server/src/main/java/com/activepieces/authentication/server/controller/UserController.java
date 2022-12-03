package com.activepieces.authentication.server.controller;


import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.exception.UserNotFoundException;
import com.activepieces.common.identity.UserIdentity;
import com.activepieces.authentication.client.model.UserInformationView;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@CrossOrigin
@RestController
@Hidden
@RequestMapping(path = "/users")
public class UserController {

  private final UserAuthenticationService userAuthenticationService;

  @Autowired
  public UserController(
      @NonNull final UserAuthenticationService userAuthenticationService) {
    this.userAuthenticationService = userAuthenticationService;
  }

  @PutMapping("/{userId}")
  public ResponseEntity<UserInformationView> update(
          @AuthenticationPrincipal UserIdentity userIdentity,
          @PathVariable("userId") UUID userId,
          @RequestBody UserInformationView requestBody)
          throws  UserNotFoundException {
    if(!userIdentity.getId().equals(userId))
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    return ResponseEntity.ok(userAuthenticationService.update(userId, requestBody));
  }

  @GetMapping("/{userId}")
  public ResponseEntity<UserInformationView> get(
          @PathVariable("userId") UUID userId)
          throws  UserNotFoundException {
    return ResponseEntity.ok(userAuthenticationService.getById(userId));
  }


}
