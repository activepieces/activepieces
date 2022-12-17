package com.activepieces.component.controller;

import com.activepieces.component.ComponentService;
import com.activepieces.component.model.ConfigOptionsRequest;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@CrossOrigin
@RestController
@Hidden
@RequestMapping()
public class ComponentController {


  private final ComponentService componentService;


  @Autowired
  public ComponentController(@NonNull final ComponentService componentService) {
    this.componentService = componentService;
  }

  @GetMapping("/components")
  public ResponseEntity<Object> getApps()
          throws Exception {
    return ResponseEntity.ok(componentService.getApps());
  }

  @PostMapping("/components/{componentName}/options")
  public ResponseEntity<List<ObjectNode>> getOptions(@PathVariable("componentName") String componentName,
                                           @RequestBody @Valid ConfigOptionsRequest configs)
          throws Exception {
    return ResponseEntity.ok(componentService.getOptions(componentName, configs.getActionName(), configs.getConfigName(), configs.getConfig()));
  }

}
