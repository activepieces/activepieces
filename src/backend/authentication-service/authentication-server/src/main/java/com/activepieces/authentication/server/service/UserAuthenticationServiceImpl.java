package com.activepieces.authentication.server.service;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.exception.AnAccountAlreadyExists;
import com.activepieces.authentication.client.exception.EmailExists;
import com.activepieces.authentication.client.exception.UserNotFoundException;
import com.activepieces.authentication.client.mapper.UserInformationMapper;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import com.activepieces.authentication.server.repository.UserInformationRepository;
import com.activepieces.entity.enums.UserStatus;
import com.activepieces.entity.sql.UserInformation;
import com.activepieces.flag.service.FlagService;
import com.activepieces.flag.service.FlagsEnum;

import com.activepieces.project.client.ProjectService;
import com.activepieces.project.client.model.CreateProjectRequest;
import com.activepieces.project.client.model.ProjectView;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Log4j2
public class UserAuthenticationServiceImpl implements UserAuthenticationService {

  private final UserInformationRepository userInformationRepository;
  private final PasswordEncoder passwordEncoder;
  private final UserInformationMapper userInformationMapper;
  private final ProjectService projectService;
  private final FlagService flagService;
  @Autowired
  public UserAuthenticationServiceImpl(
          @NonNull final UserInformationRepository userInformationRepository,
          @NonNull final PasswordEncoder passwordEncoder,
          @NonNull final UserInformationMapper userInformationMapper, ProjectService projectService, FlagService flagService) {
    this.passwordEncoder = passwordEncoder;
    this.userInformationMapper = userInformationMapper;
    this.userInformationRepository = userInformationRepository;
    this.projectService = projectService;
    this.flagService = flagService;
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
  public UserInformationView create(@NonNull SignUpRequest request) throws AnAccountAlreadyExists, EmailExists {
    if( userInformationRepository.count() > 1) {
      throw new AnAccountAlreadyExists();
    }
    if( userInformationRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
      throw new EmailExists();
    }

    if(request.getTrackEvents())
    {
      flagService.save(FlagsEnum.TRACK_USER_EVENTS.name(),"true");
    }

    final String encryptedPassword = passwordEncoder.encode(request.getPassword());
    final UserInformation userInformation =
        userInformationRepository
            .findByEmailIgnoreCase(request.getEmail())
            .orElse(
                UserInformation.builder()
                    .id(Ksuid.newKsuid())
                    .email(request.getEmail())
                    .build());
    userInformation.setFirstName(request.getFirstName());
    userInformation.setLastName(request.getLastName());
    userInformation.setPassword(encryptedPassword);
    userInformation.setStatus(UserStatus.VERIFIED);

    final List<ProjectView> projectViewList = projectService.listByOwnerId(userInformation.getId());
    if (projectViewList.isEmpty()) {
      final ProjectView projectView = projectService.create(userInformation.getId(), CreateProjectRequest.builder()
              .displayName("Project")
              .build());

    }

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

  @Override
  public boolean firstSignInFlag() {
    return userInformationRepository.count()==0;
  }

}
