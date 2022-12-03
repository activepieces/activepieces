package com.activepieces.piece.client.model;

import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
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
  private Ksuid id;

  @JsonProperty @NotEmpty private String displayName;

  @JsonProperty @NotNull private List<@Valid Variable<?>> configs;

  @JsonIgnore private Ksuid collectionId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY)
  private EditState state;

}
