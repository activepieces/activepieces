package com.activepieces.worker.controller;

import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.worker.Constants;
import com.activepieces.worker.model.ConfigOptionsRequest;
import com.activepieces.worker.service.CodeExecutionService;
import com.activepieces.worker.service.ComponentServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
@Hidden
@RequestMapping()
public class ComponentController {


  private final ComponentServiceImpl componentService;

  @Autowired
  public ComponentController(@NonNull final ComponentServiceImpl componentService) {
    this.componentService = componentService;
  }

  @GetMapping("/components")
  public ResponseEntity<Object> getApps()
          throws Exception {
    return ResponseEntity.ok(componentService.getApps());
  }

  @PostMapping("/components/{componentName}/options")
  public ResponseEntity<Object> getOptions(@PathVariable("componentName") String componentName,
                                           @RequestBody @Valid ConfigOptionsRequest configs)
          throws Exception {
    return ResponseEntity.ok(componentService.getOptions(componentName, configs.getActionName(), configs.getConfigName(), configs.getConfig()));
  }

}
