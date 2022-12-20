package com.activepieces.variable.server.strategy;

import com.activepieces.entity.subdocuments.field.oauth2.OAuth2CustomSettings;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;
import java.util.Objects;

@Log4j2
public class DirectClaimStrategy {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public DirectClaimStrategy(
            final RestTemplate restTemplate, final ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<ObjectNode> claimToken(
            String clientId, String clientSecret, String tokenUrl, String authorizationCode, String redirectUrl)
            throws JsonProcessingException {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", "authorization_code");
            map.add("client_id", clientId);
            map.add("client_secret", clientSecret);
            map.add("redirect_uri", redirectUrl);
            map.add("code", authorizationCode);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            String body = restTemplate.postForObject(URI.create(tokenUrl), request, String.class);
            return objectMapper.convertValue(objectMapper.readValue(body, ObjectNode.class), new TypeReference<>() {
            });
        } catch (Exception e) {
            if (e instanceof HttpStatusCodeException) {
                HttpStatus status = ((HttpStatusCodeException) e).getStatusCode();
                ObjectNode body =
                        objectMapper.readValue(
                                ((HttpStatusCodeException) e).getResponseBodyAsString(), ObjectNode.class);
                return ResponseEntity.status(status).body(body);
            } else {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
    }

    public Map<String, Object> refreshToken(@NonNull final OAuth2CustomSettings customSettings, @NonNull final String refreshToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", "refresh_token");
            map.add("client_id", customSettings.getClientId());
            map.add("client_secret", customSettings.getClientSecret());
            map.add("redirect_uri", customSettings.getRedirectUrl());
            map.add("refresh_token", refreshToken);
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            String body =
                    restTemplate.postForObject(
                            URI.create(
                                    Objects.nonNull(customSettings.getRefreshUrl()) && customSettings.getRefreshUrl().length() > 0 ? customSettings.getRefreshUrl() : customSettings.getTokenUrl()),
                            request,
                            String.class);
            Map<String, Object> response = objectMapper.convertValue(objectMapper.readValue(body, ObjectNode.class)
                    , new TypeReference<>() {
                    });
            response.putIfAbsent("refresh_token", refreshToken);
            return response;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

}
