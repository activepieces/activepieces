package com.activepieces.entity.nosql;

import com.activepieces.common.EntityMetadata;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.entity.subdocuments.trigger.TriggerMetadata;
import com.bol.secure.Encrypted;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Id;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@Document("flow_version")
public class FlowVersion implements EntityMetadata {

    @JsonProperty
    @Id
    private UUID id;

    @JsonProperty
    private UUID flowId;

    @JsonProperty
    private String displayName;


    @JsonProperty
    private TriggerMetadata trigger;

    @JsonProperty
    private long epochCreationTime;

    @JsonProperty
    private long epochUpdateTime;

    @JsonProperty
    private Set<ErrorResponse> errors;

    @JsonProperty
    private boolean valid;

    @JsonProperty
    private EditState state;
}
