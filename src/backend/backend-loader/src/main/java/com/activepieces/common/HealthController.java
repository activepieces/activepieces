package com.activepieces.common;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@Hidden
public class HealthController {


  @GetMapping("/health")
  public ResponseEntity<String> up() {
    return ResponseEntity.ok("UP");
  }

}
