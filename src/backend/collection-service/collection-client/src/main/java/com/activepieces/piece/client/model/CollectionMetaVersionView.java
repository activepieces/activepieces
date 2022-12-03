package com.activepieces.piece.client.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.*;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder(toBuilder = true)
public class CollectionMetaVersionView implements EntityMetadata {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid id;

  @JsonProperty @NotEmpty @NotNull private String displayName;

  @JsonIgnore private Ksuid collectionId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String logoUrl;

  @JsonProperty @NotEmpty private String description;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private EditState state;
}
