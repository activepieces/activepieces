package com.activepieces.config;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.client.request.SignUpRequest;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class StartupHousekeeper {

    private final UserAuthenticationService authenticationService;

    @Autowired
    public StartupHousekeeper(@NonNull final UserAuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @EventListener(ContextRefreshedEvent.class)
    public void contextRefreshedEvent() {
        Optional<UserInformationView> user = authenticationService.getOptional("admin@activepieces.com");
        if (user.isEmpty()) {
            authenticationService.create("admin@activepieces.com",
                    SignUpRequest.builder().firstName("Activepieces")
                            .lastName("Admin")
                            .password("password")
                            .build());
        }
    }

}
