package com.activepieces.variable.model;

import com.activepieces.entity.subdocuments.field.connection.oauth2.OAuth2Variable;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface OAuth2Service {

    ResponseEntity validateAuthorizationCode(String clientId, String clientToken, String tokenUrl, String authorizationCode) throws JsonProcessingException;

    Map<String, Object> refreshAndGetAccessToken(OAuth2Variable oAuth2LoginSettings, Map<String, Object> authResponse);
}
