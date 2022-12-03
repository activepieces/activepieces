package com.activepieces.action.component.server;

import com.activepieces.action.component.ComponentManifestView;
import com.activepieces.action.component.ComponentService;
import com.activepieces.actions.model.action.settings.ComponentSettingsView;
import com.activepieces.common.error.ErrorServiceHandler;
import com.activepieces.common.error.exception.ManifestNotFoundException;
import com.activepieces.common.utils.ArtifactUtils;
import com.activepieces.common.utils.ManifestUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ComponentServiceImpl implements ComponentService {

  private final String COMPONENT_NAME = "${COMPONENT_NAME}";
  private final String ACTION_NAME = "${ACTION_NAME}";
  private final String COMPONENT_VERSION = "${COMPONENT_VERSION}";
  private final String PACKAGE_NAME = "${PACKAGE_NAME}";
  private final String PACKAGE_VERSION = "${PACKAGE_VERSION}";
  private final ErrorServiceHandler errorServiceHandler;
  private final ObjectMapper objectMapper;
  private final Map<String, ComponentManifestView> components;

  @Autowired
  public ComponentServiceImpl(
      @NonNull final ErrorServiceHandler errorServiceHandler,
      @NonNull final ObjectMapper objectMapper) {
    this.errorServiceHandler = errorServiceHandler;
    this.objectMapper = objectMapper;
    this.components = new ConcurrentHashMap<>();
  }

  @Override
  public InputStream generateCode(ComponentSettingsView componentSettingsView)
      throws ManifestNotFoundException {
    ComponentManifestView manifestView =
        getManifest(
            componentSettingsView.getComponentName(), componentSettingsView.getComponentVersion());
    try {
      final String schemaJs =
          IOUtils.toString(
              new ClassPathResource("components/1.0/schema.js").getInputStream(),
              StandardCharsets.UTF_8);
      final String packageJson =
          IOUtils.toString(
              new ClassPathResource("components/1.0/package.json").getInputStream(),
              StandardCharsets.UTF_8);

      final Map<String, String> tokensMap =
          Map.of(
              PACKAGE_NAME,
              manifestView.getNpmPackage().getName(),
              PACKAGE_VERSION,
              manifestView.getNpmPackage().getVersion(),
              COMPONENT_NAME,
              componentSettingsView.getComponentName(),
              ACTION_NAME,
              componentSettingsView.getActionName(),
              COMPONENT_VERSION,
              componentSettingsView.getComponentVersion());

      final File buildFolder = Files.createTempDirectory("build-").toFile();

      final String builtSchemaJs = replaceAndStreamCode(schemaJs, tokensMap);
      final File buildSchemaJsFile = new File(buildFolder, "index.js");
      FileUtils.writeStringToFile(buildSchemaJsFile, builtSchemaJs, StandardCharsets.UTF_8);

      final String builtPackageJson = replaceAndStreamCode(packageJson, tokensMap);
      final File buildPackageJsonFile = new File(buildFolder, "package.json");
      FileUtils.writeStringToFile(buildPackageJsonFile, builtPackageJson, StandardCharsets.UTF_8);

      final InputStream zippedStream = ArtifactUtils.zipFolder(buildFolder.toPath());
      buildFolder.delete();
      return zippedStream;
    } catch (Exception e) {
      e.printStackTrace();;
      throw errorServiceHandler.createInternalError(e);
    }
  }

  @Override
  public ComponentManifestView getManifest(
      @NonNull String componentName, @NonNull String componentVersion)
      throws ManifestNotFoundException {
    try {
      final String manifestUrl = ManifestUtils.getManifestUrl(componentName, componentVersion);
      if (components.containsKey(manifestUrl)) {
        return components.get(manifestUrl);
      }
      ComponentManifestView componentManifestView =
          objectMapper.readValue(new URL(manifestUrl), ComponentManifestView.class);
      components.put(manifestUrl, componentManifestView);
      return componentManifestView;
    } catch (IOException e) {
      throw new ManifestNotFoundException(componentName, componentVersion, e.getMessage());
    }
  }

  private String replaceAndStreamCode(String schema, Map<String, String> tokensMap) {
    String newCode = schema;
    for (Map.Entry<String, String> entry : tokensMap.entrySet()) {
      // Replace actual replace all occurrences.
      newCode = newCode.replace(entry.getKey(), entry.getValue());
    }
    return newCode;
  }
}
