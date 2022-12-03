package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@SuperBuilder
@Entity
@Table(name = "collection", indexes = {@Index(name = "project_id_index", columnList = "project_id", unique = false)})
public class Collection implements EntityMetadata {
    public static final String PROJECT_ID = "projectId";

    @JsonProperty
    @Id
    private Ksuid id;

    @JsonProperty
    @Column(name = "name")
    private String name;

    @JsonProperty
    @Column(name = "project_id")
    private Ksuid projectId;

    @JsonProperty
    @Column(name = "epoch_creation_time")
    private long epochCreationTime;

    @JsonProperty
    @Column(name = "epoch_update_time")
    private long epochUpdateTime;

}
