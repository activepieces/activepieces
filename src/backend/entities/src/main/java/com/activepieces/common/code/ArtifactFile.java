package com.activepieces.common.code;

import lombok.*;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.social.InternalServerErrorException;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class ArtifactFile {

  private String originalFileName;
  private String contentType;
  private InputStream inputStream;
  private String hashWithExtension;

  public MultipartFile toMultiFile() throws IOException {
    return new MockMultipartFile("file", originalFileName, contentType, getInputStream());
  }

  public InputStream getInputStream() {
    try {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      inputStream.transferTo(baos);
      inputStream = new ByteArrayInputStream(baos.toByteArray());
      return new ByteArrayInputStream(baos.toByteArray());
    } catch (IOException e) {
      throw new InternalServerErrorException("Artifact", Arrays.toString(e.getStackTrace()));
    }
  }

}
