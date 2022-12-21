package com.activepieces.config;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import com.activepieces.project.client.ProjectService;
import com.activepieces.project.client.model.CreateProjectRequest;
import com.activepieces.project.client.model.ProjectView;
import com.activepieces.common.Constants;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Component
@Log4j2
public class StartupHousekeeper {


    private final UserAuthenticationService authenticationService;
    private final ProjectService projectService;
    private final Scheduler scheduler;

    @Autowired
    public StartupHousekeeper(@NonNull final UserAuthenticationService authenticationService,
                              @NonNull final Scheduler scheduleService,
                              @NonNull final ProjectService projectService) {
        this.authenticationService = authenticationService;
        this.projectService = projectService;
        this.scheduler = scheduleService;
    }

    @EventListener(ContextRefreshedEvent.class)
    public void contextRefreshedEvent() throws SchedulerException, IOException {
        log.info("Running Startup configuration");
        // Place worker js
        final Resource workerExecutor = new ClassPathResource(Constants.ACTIVEPIECES_WORKER_JS);
        final File temp = new File(Constants.ACTIVEPIECES_WORKER_ABS_PATH_JS);
        temp.getParentFile().mkdirs();
        Files.copy(
                workerExecutor.getInputStream(),
                temp.toPath(),
                StandardCopyOption.REPLACE_EXISTING);
        log.info("Copied worker js file to {}", temp.getAbsolutePath());
    }

}
