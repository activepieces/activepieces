package com.activepieces.worker.workers;

import com.activepieces.common.utils.ArtifactUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringEscapeUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.*;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Log4j2
public class CodeBuildWorker {

  private final int workerId;
  private final String CODE_BUILDER_FOLDER = "code-build";
  private final ObjectMapper objectMapper;

  public CodeBuildWorker(final int workerId, final ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.workerId = workerId;
  }

  public int getWorkerId(){
    return workerId;
  }

  public InputStream build(final InputStream rawArtifactZipFile) throws Exception {
    log.info("Building using worker " + workerId);
    File buildFolder =
        new File(CODE_BUILDER_FOLDER + File.separator + workerId + File.separator + "build");
    FileUtils.deleteDirectory(buildFolder);
    buildFolder.mkdirs();
    File zipFolder = new File(buildFolder.getAbsolutePath() + File.separator + "build.zip");
    ArtifactUtils.writeToFile(zipFolder, rawArtifactZipFile);

    ArtifactUtils.extractArtifact(zipFolder);
    zipFolder.delete();

    addWebpack(buildFolder);

    long startTime = System.currentTimeMillis();
    ArtifactUtils.runCommandAsRoot(
        String.format("npm --prefix %s install", buildFolder.getAbsolutePath()));

    log.info("Npm install took {}ms", System.currentTimeMillis() - startTime);
    startTime = System.currentTimeMillis();

    String commandResult = ArtifactUtils.runCommandAsRoot(
            String.format("npm --prefix %s run build:prod", buildFolder.getAbsolutePath()));

    log.info("Npm build took {}ms", System.currentTimeMillis() - startTime);

    File bundledJs = buildFolder.toPath().resolve("dist").resolve("bundle.js").toFile();
    if(!bundledJs.exists()){
      log.error(commandResult);
      final Resource invalidArtifact = new ClassPathResource("invalid-code.js");
      String errorCodeFile = new String(invalidArtifact.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      errorCodeFile = errorCodeFile.replace("${ERROR_MESSAGE}", StringEscapeUtils.escapeJavaScript(commandResult));
      return new ByteArrayInputStream(errorCodeFile.getBytes());
    }
    return new FileInputStream(bundledJs);
  }

  private void addWebpack(File buildFolder) throws IOException {
    log.info("Adding webpack");
    File packageJsonFile = buildFolder.toPath().resolve("package.json").toFile();
    File webpackFile = buildFolder.toPath().resolve("webpack.config.js").toFile();

    Map<String, Object> packageJson =
            packageJsonFile.exists()
                    ? objectMapper.readValue(packageJsonFile, Map.class)
                    : Collections.emptyMap();

    packageJson.putIfAbsent("scripts", new HashMap<>());
    Map<String, Object> scripts = (Map<String, Object>) packageJson.get("scripts");
    scripts.put("build:prod", "webpack --mode production");

    FileUtils.writeStringToFile(
            packageJsonFile, objectMapper.writeValueAsString(packageJson), Charset.forName("UTF-8"));

    final String webpackConfigJson =
            "const path = require('path');\n"  +
                    "module.exports = {\n" +
                    "  target: 'node',\n" +
                    "  externalsPresets: { node: true },\n" +
                    "  entry: './index.js', // make sure this matches the main root of your code \n" +
                    "  resolve: {\n" +
                    "     preferRelative: true,\n" +
                    "     extensions: ['.js']\n" +
                    "  },\n" +
                    "  output: {\n" +
                    "    libraryTarget: 'commonjs2',\n" +
                    "    path: path.join(__dirname, 'dist'), // this can be any path and directory you want\n" +
                    "    filename: 'bundle.js',\n" +
                    "  },\n" +
                    "  optimization: {\n" +
                    "    minimize: true, // enabling this reduces file size and readability\n" +
                    "  },\n" +
                    "};\n";
    FileUtils.writeStringToFile(webpackFile, webpackConfigJson, Charset.forName("UTF-8"));
  }


}
