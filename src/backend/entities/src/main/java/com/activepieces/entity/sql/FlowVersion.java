package com.activepieces.entity.sql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.trigger.TriggerMetadata;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;

import javax.persistence.*;
import java.time.Instant;
import java.util.Set;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@Entity
@Table(name = "flow_version")
@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)
public class FlowVersion implements EntityMetadata {

    @Id
    private Ksuid id;

    @Column(name = "flow_id")
    private Ksuid flowId;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "trigger", columnDefinition = "jsonb")
    @Type(type = "jsonb")
    private TriggerMetadata trigger;


    @Column(name = "errors", columnDefinition = "jsonb")
    @Type(type = "jsonb")
    private Set<ErrorResponse> errors;

    @JsonProperty
    private boolean valid;

    @JsonProperty
    private EditState state;

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
