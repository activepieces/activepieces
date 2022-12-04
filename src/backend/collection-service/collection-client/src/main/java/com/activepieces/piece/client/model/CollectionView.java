package com.activepieces.piece.client.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@SuperBuilder(toBuilder = true)
public class CollectionView implements EntityMetadata {

  @JsonProperty(access= JsonProperty.Access.READ_ONLY) private Ksuid id;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY)
  private Ksuid projectId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private CollectionVersionView lastVersion;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long created;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long updated;

  public void updateOrCreateDraft(CollectionVersionView newDraft) {
    lastVersion = newDraft;
  }

}
