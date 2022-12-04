package com.activepieces.config;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import com.activepieces.entity.sql.Project;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.project.client.ProjectService;
import com.activepieces.project.client.model.CreateProjectRequest;
import com.activepieces.project.client.model.ProjectView;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class StartupHousekeeper {

    private final UserAuthenticationService authenticationService;
    private final ProjectService projectService;

    @Autowired
    public StartupHousekeeper(@NonNull final UserAuthenticationService authenticationService,
                              @NonNull final ProjectService projectService) {
        this.authenticationService = authenticationService;
        this.projectService = projectService;
    }

    @EventListener(ContextRefreshedEvent.class)
    public void contextRefreshedEvent()  {
        final UserInformationView user = authenticationService.getOptional("admin@activepieces.com")
                .orElse(authenticationService.create("admin@activepieces.com",
                        SignUpRequest.builder().firstName("Activepieces")
                                .lastName("Admin")
                                .password("password")
                                .build()));
        final List<ProjectView> projectViewList = projectService.listByOwnerId(user.getId());
        if (projectViewList.isEmpty()) {
            final ProjectView projectView = projectService.create(user.getId(), CreateProjectRequest.builder()
                    .displayName("Project")
                    .build());
        }
    }

}
