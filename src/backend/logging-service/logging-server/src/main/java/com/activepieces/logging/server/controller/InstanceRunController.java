package com.activepieces.logging.server.controller;

import com.activepieces.common.SeekPage;
import com.activepieces.common.SeekPageRequest;
import com.activepieces.guardian.client.exception.PermissionDeniedException;
import com.activepieces.logging.client.InstanceRunService;
import com.activepieces.logging.client.exception.InstanceRunNotFoundException;
import com.activepieces.logging.client.model.InstanceRunView;
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

    @GetMapping("/instance-runs/{instanceId}")
    public ResponseEntity<InstanceRunView> get(
            @PathVariable("instanceId") UUID instanceId)
            throws InstanceRunNotFoundException, PermissionDeniedException {
        InstanceRunView instanceRunView = instanceRunService.get(instanceId);
        return ResponseEntity.ok(instanceRunView);
    }

    @GetMapping("/instances/{instanceId}/instance-runs/count")
    public ResponseEntity<Integer> count(
            @PathVariable("instanceId") UUID instanceId)
            throws PermissionDeniedException, InstanceRunNotFoundException {
        return ResponseEntity.ok(instanceRunService.countByInstanceId(instanceId));
    }

    @GetMapping("/environments/{environmentId}/instance-runs")
    public ResponseEntity<SeekPage<InstanceRunView>> list(
            @PathVariable("environmentId") UUID environmentId,
            @RequestParam(value = "accountId", required = false) UUID accountId,
            @RequestParam(value = "instanceId", required = false) UUID instanceId,
            @RequestParam(value = "startingAfter", required = false) UUID startingAfter,
            @RequestParam(value = "endingBefore", required = false) UUID endingBefore,
            @RequestParam(value = "limit", defaultValue = "10", required = false) int limit)
            throws PermissionDeniedException, InstanceRunNotFoundException {
        return ResponseEntity.ok(instanceRunService.list(environmentId, accountId, instanceId, new SeekPageRequest(startingAfter, endingBefore, limit)));
    }

}
