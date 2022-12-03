package com.activepieces.piece.client.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.fasterxml.jackson.annotation.JsonProperty;
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

  @JsonProperty(access= JsonProperty.Access.READ_ONLY) private UUID id;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY)
  private UUID projectId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private CollectionVersionView lastVersion;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY)
  private List<UUID> versionsList;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long epochCreationTime;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long epochUpdateTime;

  public void updateOrCreateDraft(CollectionVersionView newDraft) {
    if (lastVersion.getState().equals(EditState.LOCKED)) {
      versionsList.add(newDraft.getId());
    } else {
      lastVersion = newDraft;
    }
    setEpochUpdateTime(Instant.now().getEpochSecond());
  }

}
