package com.activepieces.common.code;

import lombok.*;
import org.springframework.social.InternalServerErrorException;

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
