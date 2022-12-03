package com.activepieces.common.utils;

import lombok.extern.log4j.Log4j2;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

@Log4j2
public class ArtifactUtils {

  public static String readOutputFromStream(Reader reader) throws IOException {
    try (BufferedReader br = new BufferedReader(reader)) {
      StringBuilder sb = new StringBuilder();
      String line = br.readLine();
      while (line != null) {
        sb.append(line);
        sb.append(System.lineSeparator());
        line = br.readLine();
      }
      return sb.toString();
    }
  }

  public static String bundledFileName(String artifact) {
    return FilenameUtils.removeExtension(artifact) + ".js";
  }

  public static void extractArtifact(File artifact) throws IOException {
    ArtifactUtils.extractFolder(artifact);
    // Remove Single directory
    File parentDirectory = artifact.getParentFile();
    if (containsSingleFolder(parentDirectory)) {
      log.debug("Containing single directory, extracting content");
      extractContent(parentDirectory);
    }
  }

  private static void extractContent(File parentFile) throws IOException {
    File child =
        Arrays.stream(Objects.requireNonNull(parentFile.listFiles()))
            .filter(File::isDirectory)
            .findFirst()
            .get();
    for (File file : Objects.requireNonNull(child.listFiles())) {
      File destFile = new File(parentFile.getAbsolutePath() + File.separator + file.getName());
      Files.move(file.toPath(), destFile.toPath(), StandardCopyOption.ATOMIC_MOVE);
    }
    child.delete();
  }

  public static String runCommandAsRoot(String command) throws IOException, InterruptedException {
    String[] commands = {"/bin/bash", "-c", command};
    ProcessBuilder ps = new ProcessBuilder(commands);
    ps.redirectErrorStream(true);
    Process pb = ps.start();
    String output = readOutputFromStream(new InputStreamReader(pb.getInputStream()));
    pb.waitFor();
    return output;
  }

  private static void extractFolder(File file) throws IOException {
    int buffer = 2048;

    try (ZipFile zip = new ZipFile(file)) {
      String newPath = file.getParentFile().getAbsolutePath();
      new File(newPath).mkdir();
      Enumeration<? extends ZipEntry> zipFileEntries = zip.entries();

      // Process each entry
      while (zipFileEntries.hasMoreElements()) {
        // grab a zip file entry
        ZipEntry entry = zipFileEntries.nextElement();
        String currentEntry = entry.getName();

        File destFile = new File(newPath, currentEntry);
        File destinationParent = destFile.getParentFile();

        // create the parent directory structure if needed
        destinationParent.mkdirs();

        if (!entry.isDirectory()) {
          BufferedInputStream is = new BufferedInputStream(zip.getInputStream(entry));
          int currentByte;
          // establish buffer for writing file
          byte[] data = new byte[buffer];

          // write the current file to disk
          FileOutputStream fos = new FileOutputStream(destFile);
          try (BufferedOutputStream dest = new BufferedOutputStream(fos, buffer)) {

            // read and write until last byte is encountered
            while ((currentByte = is.read(data, 0, buffer)) != -1) {
              dest.write(data, 0, currentByte);
            }
            dest.flush();
            is.close();
          }
        }
      }
    }
  }

  public static InputStream zipFolder(Path sourceFolderPath) throws Exception {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ZipOutputStream zos = new ZipOutputStream(baos);
    Files.walkFileTree(sourceFolderPath, new SimpleFileVisitor<Path>() {
      public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
        zos.putNextEntry(new ZipEntry(sourceFolderPath.relativize(file).toString()));
        Files.copy(file, zos);
        zos.closeEntry();
        return FileVisitResult.CONTINUE;
      }
    });
    zos.close();
    return new ByteArrayInputStream(baos.toByteArray());
  }

  private static boolean containsSingleFolder(File parent) {
    return Arrays.stream(Objects.requireNonNull(parent.listFiles()))
            .filter(File::isDirectory)
            .count()
        == 1;
  }

  public static void writeToFile(File output, InputStream inputStream) throws IOException {
    try (OutputStream outputStream = new FileOutputStream(output)) {
      IOUtils.copy(inputStream, outputStream);
    } catch (IOException e) {
      throw e;
    }
  }
}
