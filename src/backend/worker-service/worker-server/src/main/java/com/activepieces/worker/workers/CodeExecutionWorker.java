package com.activepieces.worker.workers;

import com.activepieces.common.error.exception.InvalidCodeArtifactException;

import com.activepieces.entity.subdocuments.runs.ActionExecutionStatus;
import com.activepieces.worker.Sandbox;
import com.activepieces.worker.model.CodeExecutionStatusEnum;
import com.activepieces.worker.model.ExecutionCodeResult;
import com.activepieces.common.utils.ArtifactUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Log4j2
public class CodeExecutionWorker {

  private final String FUNCTION_OUTPUT = "_functionOutput.txt";
  private final String STANDARD_OUTPUT = "_standardOutput.txt";
  private final String STANDARD_ERROR = "_standardError.txt";
  private final String INPUT_FILENAME = "_input.txt";
  private final String META_FILENAME = "meta.txt";

  private final Sandbox sandbox;
  private final ObjectMapper objectMapper;

  public CodeExecutionWorker(
      final ObjectMapper objectMapper,
      final Sandbox sandbox) {
    this.sandbox = sandbox;
    this.objectMapper = objectMapper;
  }

  public ExecutionCodeResult executeSync(final JsonNode input, final InputStream bundledJs)
      throws InterruptedException {
    try {
      ExecutionCodeResult result;
      sandbox.clean();
      sandbox.init();
      copyBundledJs(bundledJs);
      run(input);
      result =
          constructResult(input, fetchStandardOutput(), fetchStandardError(), fetchCodeReturn());
      return result;
    } catch (IOException | InvalidCodeArtifactException exception) {
      exception.printStackTrace();
      return ExecutionCodeResult.builder()
          .input(input)
          .verdict(CodeExecutionStatusEnum.INVALID_ARTIFACT)
          .status(ActionExecutionStatus.FAILED)
          .errorMessage(CodeExecutionStatusEnum.INVALID_ARTIFACT.getMessage())
          .build();
    }
  }

  private void copyBundledJs(InputStream artifact)
      throws IOException, InvalidCodeArtifactException {
    final File destFile = new File(sandbox.getSandboxFilePath("index.js"));
    Files.copy(artifact, destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

    // Copy code-executor
    final Resource codeExecutor = new ClassPathResource("code-executor.js");
    final File codeExecutorDest = new File(sandbox.getSandboxFilePath("code-executor.js"));
    Files.copy(
        codeExecutor.getInputStream(),
        codeExecutorDest.toPath(),
        StandardCopyOption.REPLACE_EXISTING);
    final File indexFile = new File(sandbox.getSandboxFilePath("index.js"));
    if (!indexFile.exists()) {
      throw new InvalidCodeArtifactException("");
    }
  }

  private ExecutionCodeResult constructResult(
      JsonNode input, String output, String errorMessage, Object codeReturn) throws IOException {
    String meta =
        ArtifactUtils.readOutputFromStream(
            new FileReader(sandbox.getSandboxFilePath(META_FILENAME)));
    String[] lines = meta.split("\n");
    Map<String, String> metaResult = new HashMap<>();
    for (String line : lines) {
      String[] keyValue = line.split(":");
      metaResult.put(keyValue[0], keyValue[1]);
    }
    CodeExecutionStatusEnum status = CodeExecutionStatusEnum.fromStatus(metaResult.get("status"));
    return ExecutionCodeResult.builder()
        .verdict(status)
        .timeInSeconds(Double.parseDouble(metaResult.get("time")))
        .output(codeReturn)
        .errorMessage(errorMessage)
        .input(input)
        .status(
            status.equals(CodeExecutionStatusEnum.OK)
                ? ActionExecutionStatus.SUCCEEDED
                : ActionExecutionStatus.FAILED)
        .standardOutput(output)
        .build();
  }

  private Object tryParseJson(String output) {
    try {
      return objectMapper.valueToTree(objectMapper.readTree(output));
    } catch (JsonProcessingException e) {
      return output;
    }
  }

  private Object fetchCodeReturn() throws IOException {
    File outputFile = new File(sandbox.getSandboxFilePath(FUNCTION_OUTPUT));
    if (!outputFile.exists()) return null;
    return tryParseJson(ArtifactUtils.readOutputFromStream(new FileReader(outputFile)));
  }

  private String fetchStandardError() throws IOException {
    return ArtifactUtils.readOutputFromStream(
        new FileReader(sandbox.getSandboxFilePath(STANDARD_ERROR)));
  }

  private String fetchStandardOutput() throws IOException {
    return ArtifactUtils.readOutputFromStream(
        new FileReader(sandbox.getSandboxFilePath(STANDARD_OUTPUT)));
  }

  private String run(JsonNode input) throws IOException, InterruptedException {
    try (PrintWriter out = new PrintWriter(sandbox.getSandboxFilePath(INPUT_FILENAME))) {
      out.println(objectMapper.writeValueAsString(input));
    }
    return sandbox.runJsFile("code-executor.js");
  }


}
