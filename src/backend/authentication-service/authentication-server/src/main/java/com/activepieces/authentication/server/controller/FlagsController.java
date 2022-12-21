package com.activepieces.authentication.server.controller;

import com.activepieces.authentication.client.UserAuthenticationService;
import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.authentication.server.repository.UserInformationRepository;
import com.activepieces.flag.service.FlagService;
import com.activepieces.flag.service.FlagsEnum;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin
@Log4j2
@RestController
@Hidden
@RequestMapping(path = "/flags")
public class FlagsController {
    private final FlagService flagService;
    private final UserAuthenticationService userAuthenticationService;
    public FlagsController(@NonNull final FlagService flagService, @NonNull final UserAuthenticationService userAuthenticationService) {
        this.flagService = flagService;
        this.userAuthenticationService = userAuthenticationService;
    }

    @GetMapping("/first-sign-in")
    public ResponseEntity<Boolean> getIsFirstSignIn()
     {
        return ResponseEntity.ok(userAuthenticationService.firstSignInFlag());
    }

    @GetMapping("/track-events")
    public ResponseEntity<Boolean> getIsTrackingEventsAllowed()
    {
        return ResponseEntity.ok(flagService.getIsTrackingEventsAllowed());
    }
}
