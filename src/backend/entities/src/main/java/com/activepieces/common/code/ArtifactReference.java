package com.activepieces.common.code;

import lombok.*;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class ArtifactReference {

  private String artifact;
  private String artifactUrl;

}
