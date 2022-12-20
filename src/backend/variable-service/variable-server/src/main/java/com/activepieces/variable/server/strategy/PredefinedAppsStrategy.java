package com.activepieces.variable.server.strategy;

import com.activepieces.entity.subdocuments.field.oauth2.OAuth2CustomSettings;
import com.activepieces.entity.subdocuments.field.oauth2.OAuth2PredefinedSettings;
import com.activepieces.variable.server.request.ClaimOAuth2PredefinedRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Log4j2
public class PredefinedAppsStrategy {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String secretManagerUrl;

    public PredefinedAppsStrategy(
            final String secretManagerUrl,
            final RestTemplate restTemplate, final ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.secretManagerUrl = secretManagerUrl;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<ObjectNode> claimToken(final ClaimOAuth2PredefinedRequest request)
            throws JsonProcessingException {
        final String postUrl = String.format("%s/claim", secretManagerUrl);
        Map<String, String> body = Map.of("component_name", request.getComponentName(),
                "code", request.getCode());
        HttpEntity<String> httpRequest = new HttpEntity<>(objectMapper.writeValueAsString(body), new HttpHeaders());
        final String result = restTemplate.postForObject(postUrl, httpRequest, String.class);
        return objectMapper.convertValue(objectMapper.readValue(result, ObjectNode.class), new TypeReference<>() {
        });
    }

    public Map<String, Object> refreshToken(@NonNull final String componentName, @NonNull final String refreshToken) {
        try {
            final String refreshUrl = String.format("%s/refresh", secretManagerUrl);
            Map<String, String> body = Map.of("component_name", componentName,
                    "refreshToken", refreshToken);
            HttpEntity<String> httpRequest = new HttpEntity<>(objectMapper.writeValueAsString(body), new HttpHeaders());
            final String result = restTemplate.postForObject(refreshUrl, httpRequest, String.class);
            return objectMapper.convertValue(objectMapper.readValue(result, ObjectNode.class), new TypeReference<>() {
            });
        }catch (JsonProcessingException exception){
            throw new RuntimeException("Unexpected json error", exception);
        }
    }

}
