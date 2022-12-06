package com.activepieces.worker.controller;

import com.activepieces.worker.service.CodeExecutionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin
@RestController
@Hidden
@RequestMapping
public class CodeController {

  private final CodeExecutionService codeExecutionService;
  private final ObjectMapper objectMapper;

  @Autowired
  public CodeController(
      @NonNull final ObjectMapper objectMapper,
      @NonNull final CodeExecutionService codeExecutionService) {
    this.codeExecutionService = codeExecutionService;
    this.objectMapper = objectMapper;
  }

  @Secured("ROLE_USER")
  @PostMapping("/execute-code")
  public ResponseEntity<Object> create(
      @RequestPart(value = "input") Object jsonNode,
      @RequestPart(value = "artifact") MultipartFile multipartFile)
          throws Exception {
    return ResponseEntity.ok(
        codeExecutionService.executeCode(
            objectMapper.convertValue(jsonNode, JsonNode.class), multipartFile.getInputStream()));
  }

}
