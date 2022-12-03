package com.activepieces.apikey.server.controller;

import com.activepieces.apikey.client.ApiKeyService;
import com.activepieces.common.error.exception.ApiKeyNotFoundException;
import com.activepieces.apikey.client.model.ApiKeyView;
import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.guardian.client.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@CrossOrigin
@RestController
@Hidden
@RequestMapping
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @Autowired
    public ApiKeyController(
            @NonNull final ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @GetMapping("/api-keys/{apiKeyId}")
    public ResponseEntity<ApiKeyView> get(
            @PathVariable("apiKeyId") String apiKeyId)
            throws ApiKeyNotFoundException, PermissionDeniedException {
        ApiKeyView apiKeyView;
        if(apiKeyId.startsWith("ak_")){
            apiKeyView = apiKeyService.getBySecretKey(apiKeyId);
        }else{
            apiKeyView = apiKeyService.getById(UUID.fromString(apiKeyId));
        }
        return ResponseEntity.ok(apiKeyView);
    }

    @Secured("ROLE_USER")
    @GetMapping("/projects/{projectId}/api-keys")
    public ResponseEntity<SeekPage<ApiKeyView>> list(
            @PathVariable("projectId") UUID projectId,
            @RequestParam(value = "startingAfter", required = false) UUID startingAfter,
            @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
            throws PermissionDeniedException, ApiKeyNotFoundException {
        return ResponseEntity.ok(apiKeyService.list(projectId, new SeekPageRequest(startingAfter, null, limit)));
    }

    @Secured("ROLE_USER")
    @PostMapping("/projects/{projectId}/api-keys")
    public ResponseEntity<ApiKeyView> create(
            @PathVariable("projectId") UUID projectId,
            @RequestBody @Valid ApiKeyView request)
            throws PermissionDeniedException, ResourceNotFoundException {
        return ResponseEntity.ok(apiKeyService.create(projectId,request));
    }

    @Secured("ROLE_USER")
    @DeleteMapping("/api-keys/{apiKeyId}")
    public void delete( @PathVariable("apiKeyId") UUID apiKeyId)
            throws ApiKeyNotFoundException, PermissionDeniedException, ResourceNotFoundException {
        ApiKeyView apiKeyView = apiKeyService.getById(apiKeyId);
        apiKeyService.delete(apiKeyId);
    }

}
