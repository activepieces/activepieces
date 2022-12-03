package com.activepieces.flow.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@SuperBuilder(toBuilder = true)
public class FlowView implements EntityMetadata {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID id;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private UUID collectionId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private FlowVersionView lastVersion;

  @JsonProperty(access= JsonProperty.Access.READ_ONLY)
  private List<UUID> versionsList;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;

  public void updateOrCreateDraft(FlowVersionView newDraft) {
    if (lastVersion.getState().equals(EditState.LOCKED)) {
      versionsList.add(newDraft.getId());
    }
    lastVersion = newDraft;
    this.epochUpdateTime = Instant.now().toEpochMilli();
  }


}
