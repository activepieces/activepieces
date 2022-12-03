package com.activepieces.worker;

import com.activepieces.authentication.client.util.JWTUtils;
import com.activepieces.common.identity.WorkerIdentity;
import com.activepieces.entity.subdocuments.runs.ActionExecutionStatus;
import com.activepieces.entity.subdocuments.runs.StepOutput;
import com.activepieces.flow.model.FlowVersionView;
import com.activepieces.piece.client.model.CollectionVersionView;
import com.activepieces.common.utils.ArtifactUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.NonNull;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.io.FileUtils;

import javax.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Map;
import java.util.UUID;

@Log4j2
public class Sandbox {

  private final int boxId;
  private final long TIME_LIMIT_IN_SECONDS = 15 * 60L;
  private final String META_FILENAME = "meta.txt";
  private final String STANDARD_OUTPUT = "_standardOutput.txt";
  private final String STANDARD_ERROR = "_standardError.txt";

  public Sandbox(final int boxId) {
    this.boxId = boxId;
  }

  public int getBoxId() {
    return this.boxId;
  }

  public void init() throws IOException, InterruptedException {
    runIsolate(String.format("--box-id=%d --init", boxId));
  }

  public void clean() throws IOException, InterruptedException {
    runIsolate(String.format("--box-id=%d --cleanup", boxId));
  }

  public String runIsolate(String command) throws IOException, InterruptedException {
    String ISOLATE_BINARY = "./isolate";
    final String commandLine = String.format("%s %s", ISOLATE_BINARY, command);
    return ArtifactUtils.runCommandAsRoot(commandLine);
  }

  public void writeCode(@NotNull String fileName, @NonNull InputStream inputStream)
      throws IOException {
    File targetFilePath = new File(getSandboxFilePath("codes/" + fileName));
    FileUtils.copyInputStreamToFile(inputStream, targetFilePath);
  }

  public void writeFlow(
      @NotNull FlowVersionView flowVersionView, @NonNull ObjectMapper objectMapper)
      throws IOException {
    String targetFilePath =
        getSandboxFilePath("flows/" + flowVersionView.getId().toString() + ".json");
    FileUtils.writeStringToFile(
        new File(targetFilePath),
        objectMapper.writeValueAsString(flowVersionView),
        Charset.forName("UTF-8"));
  }

  public void writeEntryPoint(
          @NonNull CollectionVersionView collectionVersionView,
          @NonNull FlowVersionView flowVersionView,
          UUID instanceId,
          @NonNull String apiUrl,
          @NonNull ObjectMapper objectMapper)
      throws IOException {
    String targetFilePath = getSandboxFilePath("input.json");
    ObjectNode entryJson = objectMapper.createObjectNode();
    entryJson.put("flowVersionId", flowVersionView.getId().toString());
    entryJson.put("collectionVersionId", collectionVersionView.getId().toString());
    entryJson.put("apiUrl", apiUrl);
    entryJson.put("workerToken", JWTUtils.createTokenWithDefaultExpiration(
            WorkerIdentity.builder()
                    .collectionId(collectionVersionView.getCollectionId())
                    .instanceId(instanceId)
                    .flowId(flowVersionView.getFlowId())
                    .build()
    ));
    FileUtils.writeStringToFile(
        new File(targetFilePath),
        objectMapper.writeValueAsString(entryJson),
        Charset.forName("UTF-8"));
  }

  public void writeContext(
          @NotNull Map<String, Object> userInput, @NonNull ObjectMapper objectMapper)
          throws IOException {
    String targetFilePath = getSandboxFilePath("context.json");
    FileUtils.writeStringToFile(
            new File(targetFilePath),
            objectMapper.writeValueAsString(userInput),
            Charset.forName("UTF-8"));
  }

  public void writeConfigs(
      @NotNull Map<String, Object> userInput, @NonNull ObjectMapper objectMapper)
      throws IOException {
    String targetFilePath = getSandboxFilePath("configs.json");
    FileUtils.writeStringToFile(
        new File(targetFilePath),
        objectMapper.writeValueAsString(userInput),
        Charset.forName("UTF-8"));
  }

  public void writeTriggerPayload(
      @NotNull Map<String, Object> userInput, @NonNull ObjectMapper objectMapper)
      throws IOException {
    String targetFilePath = getSandboxFilePath("triggerPayload.json");
    StepOutput stepOutput =
            StepOutput.builder()
                    .duration(0)
                    .output(userInput)
                    .status(ActionExecutionStatus.SUCCEEDED).build();
    FileUtils.writeStringToFile(
        new File(targetFilePath),
        objectMapper.writeValueAsString(stepOutput),
        Charset.forName("UTF-8"));
  }

  public void writeCollection(
      @NonNull CollectionVersionView collectionVersionView, @NonNull ObjectMapper objectMapper)
      throws IOException {
    String targetFilePath =
        getSandboxFilePath("collections/" + collectionVersionView.getId().toString() + ".json");
    FileUtils.writeStringToFile(
        new File(targetFilePath),
        objectMapper.writeValueAsString(collectionVersionView),
        Charset.forName("UTF-8"));
  }

  public String getSandboxFilePath(String fileName) {
    return getSandboxFolderPath() + fileName;
  }

  public String runJsFile(String fileName) throws IOException, InterruptedException {
    return runIsolate(
        String.format(
            "--dir=/usr/bin/ --dir=/etc/ --share-net --full-env --box-id=%d --processes --wall-time=%d "
                + "--meta=%s --stdout=%s --stderr=%s "
                + " --run /usr/bin/node %s",
            boxId,
            TIME_LIMIT_IN_SECONDS,
            getSandboxFilePath(META_FILENAME),
            STANDARD_OUTPUT,
            STANDARD_ERROR,
            fileName));
  }

  private String getSandboxFolderPath() {
    String SANDBOX_LOCATION_TEMPLATE = "/var/local/lib/isolate/%d";
    return String.format(SANDBOX_LOCATION_TEMPLATE, boxId) + "/box/";
  }
}
