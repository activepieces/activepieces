package com.activepieces.logging.server.controller;

import com.activepieces.common.pagination.Cursor;
import com.activepieces.common.pagination.SeekPage;
import com.activepieces.common.pagination.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.exception.InstanceRunNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
import com.github.ksuid.Ksuid;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@CrossOrigin
@RestController
@Hidden
@RequestMapping
public class InstanceRunController {

    private final InstanceRunService instanceRunService;

    @Autowired
    public InstanceRunController(
            @NonNull final InstanceRunService instanceRunService) {
        this.instanceRunService = instanceRunService;
    }

    @GetMapping("/instance-runs/{instanceRunId}")
    public ResponseEntity<InstanceRunView> get(
            @PathVariable("instanceRunId") Ksuid instanceRunId)
            throws InstanceRunNotFoundException, PermissionDeniedException {
        InstanceRunView instanceRunView = instanceRunService.get(instanceRunId);
        return ResponseEntity.ok(instanceRunView);
    }

    @GetMapping("/projects/{projectId}/instance-runs")
    public ResponseEntity<SeekPage<InstanceRunView>> list(
            @PathVariable("projectId") Ksuid projectId,
            @RequestParam(value = "cursor", required = false) Cursor cursor,
            @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
            throws PermissionDeniedException, InstanceRunNotFoundException {
        return ResponseEntity.ok(instanceRunService.list(projectId, new SeekPageRequest(cursor, limit)));
    }

}
