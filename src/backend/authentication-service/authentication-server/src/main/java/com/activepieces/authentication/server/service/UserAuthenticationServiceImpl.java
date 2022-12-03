package com.activepieces.authentication.server.service;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.exception.UserNotFoundException;
import com.activepieces.authentication.client.mapper.UserInformationMapper;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import com.activepieces.authentication.server.repository.UserInformationRepository;
import com.activepieces.entity.enums.UserStatus;
import com.activepieces.entity.sql.UserInformation;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@Log4j2
public class UserAuthenticationServiceImpl implements UserAuthenticationService {

  private final UserInformationRepository userInformationRepository;
  private final PasswordEncoder passwordEncoder;
  private final UserInformationMapper userInformationMapper;
  @Autowired
  public UserAuthenticationServiceImpl(
      @NonNull final UserInformationRepository userInformationRepository,
      @NonNull final PasswordEncoder passwordEncoder,
      @NonNull final UserInformationMapper userInformationMapper) {
    this.passwordEncoder = passwordEncoder;
    this.userInformationMapper = userInformationMapper;
    this.userInformationRepository = userInformationRepository;
  }

  @Override
  public Optional<UserInformationView> getOptional(@NonNull final Ksuid userId) {
    Optional<UserInformation> optional = userInformationRepository.findById(userId);
    if (optional.isEmpty()) {
      return Optional.empty();
    }
    return Optional.of(userInformationMapper.toView(optional.get()));
  }

  @Override
  public Optional<UserInformationView> getOptional(@NonNull String name) {
    Optional<UserInformation> optional = userInformationRepository.findByEmailIgnoreCase(name);
    if (optional.isEmpty()) {
      return Optional.empty();
    }
    return Optional.of(userInformationMapper.toView(optional.get()));
  }

  @Override
  public UserInformationView getById(@NonNull final Ksuid userId) throws UserNotFoundException {
    Optional<UserInformationView> optional = getOptional(userId);
    if (optional.isEmpty()) {
      throw new UserNotFoundException(userId);
    }
    return optional.get();
  }

  @Override
  public Optional<UserInformationView> getByCredentials(
      @NonNull final String email, @NonNull final String password) {
    Optional<UserInformation> userInformation =
        userInformationRepository.findByEmailIgnoreCase(email);
    if (userInformation.isEmpty()) {
      return Optional.empty();
    }
    if (!passwordEncoder.matches(password, userInformation.get().getPassword())) {
      return Optional.empty();
    }
    return Optional.of(userInformationMapper.toView(userInformation.get()));
  }

  @Override
  public UserInformationView create(@NonNull String email, @NonNull SignUpRequest request) {
    final String encryptedPassword = passwordEncoder.encode(request.getPassword());
    final UserInformation userInformation =
        userInformationRepository
            .findByEmailIgnoreCase(email)
            .orElse(
                UserInformation.builder()
                    .id(Ksuid.newKsuid())
                    .email(email)
                    .epochUpdateTime(Instant.now().getEpochSecond())
                    .epochCreationTime(Instant.now().getEpochSecond())
                    .build());
    userInformation.setFirstName(request.getFirstName());
    userInformation.setLastName(request.getLastName());
    userInformation.setPassword(encryptedPassword);
    userInformation.setStatus(UserStatus.VERIFIED);
    return userInformationMapper.toView(userInformationRepository.save(userInformation));
  }

  @Override
  public UserInformationView update(
      @NonNull final Ksuid userId, @NonNull final UserInformationView request)
      throws UserNotFoundException {
    Optional<UserInformation> userInformationOptional = userInformationRepository.findById(userId);
    if (userInformationOptional.isEmpty()) {
      throw new UserNotFoundException(userId);
    }
    final UserInformation userInformation = userInformationOptional.get();
    userInformation.setFirstName(request.getFirstName());
    userInformation.setLastName(request.getLastName());
    return userInformationMapper.toView(userInformationRepository.save(userInformation));
  }

}
