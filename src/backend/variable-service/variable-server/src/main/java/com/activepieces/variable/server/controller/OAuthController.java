package com.activepieces.variable.server.controller;

import com.activepieces.variable.server.request.ClaimOAuth2PredefinedRequest;
import com.activepieces.variable.server.request.ClaimOAuth2RequestWithSecret;
import com.activepieces.variable.server.OAuth2ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Hidden
@RequestMapping("oauth2")
public class OAuthController {

    private final OAuth2ServiceImpl oAuth2Service;

    @Autowired
    public OAuthController(
            @NonNull final OAuth2ServiceImpl oAuth2Service) {
        this.oAuth2Service = oAuth2Service;
    }

    @PostMapping("/claim-predefined")
    public ResponseEntity<?> claimPredefinedAuth(@RequestBody ClaimOAuth2PredefinedRequest request)
            throws JsonProcessingException {
        return oAuth2Service.claimPredefinedToken(request);
    }

    @PostMapping("/claim-custom")
    public ResponseEntity<?> claimOAuth2(@RequestBody ClaimOAuth2RequestWithSecret request)
            throws JsonProcessingException {
        return oAuth2Service.claimCustomToken(request);
    }
  
}
