package com.activepieces.variable.server;

import com.activepieces.entity.subdocuments.field.oauth2.OAuth2CustomSettings;
import com.activepieces.entity.subdocuments.field.oauth2.OAuth2Settings;
import com.activepieces.entity.subdocuments.field.oauth2.OAuth2Variable;
import com.activepieces.variable.server.request.ClaimOAuth2PredefinedRequest;
import com.activepieces.variable.server.request.ClaimOAuth2RequestWithSecret;
import com.activepieces.variable.server.strategy.DirectClaimStrategy;
import com.activepieces.variable.server.strategy.PredefinedAppsStrategy;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Objects;

@Log4j2
@Service
public class OAuth2ServiceImpl {

  private final DirectClaimStrategy directClaimStrategy;
  private final PredefinedAppsStrategy predefinedAppsStrategy;

  @Autowired
  public OAuth2ServiceImpl(
          @Value("${com.activepieces.secret-manager-url}") final String secretManagerUrl,
          ObjectMapper objectMapper,
          RestTemplate restTemplate) {
    this.directClaimStrategy = new DirectClaimStrategy(restTemplate, objectMapper);
    this.predefinedAppsStrategy = new PredefinedAppsStrategy(secretManagerUrl, restTemplate, objectMapper);
  }

  public ResponseEntity<?> claimPredefinedToken(@NonNull final ClaimOAuth2PredefinedRequest request)
          throws JsonProcessingException {
    return predefinedAppsStrategy.claimToken(request);
  }


  public ResponseEntity<?> claimCustomToken(@NonNull final ClaimOAuth2RequestWithSecret request)
          throws JsonProcessingException {
    return directClaimStrategy.claimToken(request.getClientId(), request.getClientSecret(), request.getTokenUrl(), request.getCode(), request.getRedirectUrl());
  }


  public Map<String, Object> refreshToken(
          @NotNull final OAuth2Variable variable, @NotNull final Map<String, Object> oAuth2Response) {
    final String refreshToken = getRefreshToken(oAuth2Response);
    if (Objects.isNull(refreshToken)) {
      return oAuth2Response;
    }
    Map<String, Object> refreshedResponse = null;
    OAuth2Settings settings = variable.getSettings();
    switch (settings.getType()) {
      case CUSTOM:
        OAuth2CustomSettings customSettings = (OAuth2CustomSettings) settings;
        refreshedResponse = directClaimStrategy.refreshToken(customSettings, refreshToken);
        break;
      case PREDEFINED:
        refreshedResponse = predefinedAppsStrategy.refreshToken(settings.getComponentName(), refreshToken);
        break;
    }
    refreshedResponse.put("auth_response", oAuth2Response.get("auth_response"));
    return refreshedResponse;
  }

  private static String getRefreshToken(Map<String, Object> objectNode){
    final String refreshToken = "refresh_token";
    if(!objectNode.containsKey(refreshToken)){
      return null;
    }
    return (String) objectNode.get("refresh_token");
  }

}
