package com.activepieces.flow.model;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@SuperBuilder(toBuilder = true)
public class FlowView implements EntityMetadata {

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid id;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private Ksuid collectionId;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private FlowVersionView lastVersion;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochCreationTime;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private long epochUpdateTime;

  public void updateOrCreateDraft(FlowVersionView newDraft) {
    this.lastVersion = newDraft;
    this.epochUpdateTime = Instant.now().toEpochMilli();
  }


}
