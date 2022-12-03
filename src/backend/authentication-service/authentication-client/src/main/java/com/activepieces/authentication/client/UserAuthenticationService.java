package com.activepieces.authentication.client;

import com.activepieces.authentication.client.exception.UserNotFoundException;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import lombok.NonNull;

import java.util.Optional;
import java.util.UUID;

public interface UserAuthenticationService {

  Optional<UserInformationView> getOptional(@NonNull final UUID userId);

  UserInformationView getById(@NonNull final UUID userId) throws UserNotFoundException;

  Optional<UserInformationView> getByCredentials(
      @NonNull final String email, @NonNull final String password);

  UserInformationView create(@NonNull final String email, @NonNull final SignUpRequest request);

  UserInformationView update(
      @NonNull final UUID userId,
      @NonNull final UserInformationView userInformationRequest)
      throws UserNotFoundException;

}
