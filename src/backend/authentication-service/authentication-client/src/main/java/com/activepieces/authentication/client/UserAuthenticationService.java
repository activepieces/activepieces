package com.activepieces.authentication.client;

import com.activepieces.authentication.client.exception.AnAccountAlreadyExists;
import com.activepieces.authentication.client.exception.EmailExists;
import com.activepieces.authentication.client.exception.UserNotFoundException;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import com.github.ksuid.Ksuid;
import lombok.NonNull;

import java.util.Optional;

public interface UserAuthenticationService {

  Optional<UserInformationView> getOptional(@NonNull final Ksuid userId);

  Optional<UserInformationView> getOptional(@NonNull final String name);

  UserInformationView getById(@NonNull final Ksuid userId) throws UserNotFoundException;

  Optional<UserInformationView> getByCredentials(
      @NonNull final String email, @NonNull final String password);

  UserInformationView create(@NonNull final SignUpRequest request) throws AnAccountAlreadyExists, EmailExists;

  UserInformationView update(
      @NonNull final Ksuid userId,
      @NonNull final UserInformationView userInformationRequest)
      throws UserNotFoundException;
  boolean firstSignInFlag();

}
