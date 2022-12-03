package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "flow", indexes = {@Index(name = "flow_collection_id_index", columnList = "collection_id", unique = false)})
public class Flow implements EntityMetadata {

  public static final String COLLECTION_ID = "collectionId";

  @Id private Ksuid id;

  @Column(name = "name")
  private String name;

  @Column(name = "collection_id")
  private Ksuid collectionId;

  @JsonProperty
  @Column(name = "epoch_creation_time")
  private long epochCreationTime;

  @JsonProperty
  @Column(name = "epoch_update_time")
  private long epochUpdateTime;


}
