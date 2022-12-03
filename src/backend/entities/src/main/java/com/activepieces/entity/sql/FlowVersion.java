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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
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

    @Column(name = "epoch_creation_time")
    private long epochCreationTime;

    @Column(name = "epoch_update_time")
    private long epochUpdateTime;

    @Column(name = "errors", columnDefinition = "jsonb")
    @Type(type = "jsonb")
    private Set<ErrorResponse> errors;

    @JsonProperty
    private boolean valid;

    @JsonProperty
    private EditState state;
}
