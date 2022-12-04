package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.persistence.*;
import java.time.Instant;

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

    @Column(name = "created", nullable = false)
    private long created;

    @Column(name = "updated", nullable = false)
    private long updated;


    @PrePersist
    protected void onCreate() {
        long currentMs = Instant.now().toEpochMilli();
        created = currentMs;
        updated = currentMs;
    }

    @PreUpdate
    protected void onUpdate() {
        updated = Instant.now().toEpochMilli();
    }

}
