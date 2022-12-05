package com.activepieces.entity.sql;


import com.activepieces.common.EntityMetadata;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.*;
import java.time.Instant;

@Entity
@Getter
@AllArgsConstructor
@Builder(toBuilder = true)
@NoArgsConstructor
@Table(name = "FILES", indexes = {@Index(name = "file_name_index", columnList = "name", unique = true)})
public class FileEntity implements EntityMetadata {

    @Id
    private Ksuid id;

    @Column(name = "name")
    private String name;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "size")
    private Long size;

    @Column(name = "data", columnDefinition = "bytea")
    private byte[] data;

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
