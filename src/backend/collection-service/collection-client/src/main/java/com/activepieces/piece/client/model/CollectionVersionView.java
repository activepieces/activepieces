package com.activepieces.piece.client.model;

import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder(toBuilder = true)
public class CollectionVersionView {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID id;

  @JsonProperty @NotEmpty private String displayName;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private String logoUrl;

  @JsonProperty @NotNull private List<@Valid Variable<?>> configs;

  @JsonIgnore private UUID collectionId;

  @JsonProperty @NotNull private String description;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY) private Set<UUID> flowsVersionId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY)
  private EditState state;

}
