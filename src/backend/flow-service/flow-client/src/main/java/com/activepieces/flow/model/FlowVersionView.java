package com.activepieces.flow.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.entity.enums.EditState;
import com.activepieces.trigger.model.TriggerMetadataView;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class FlowVersionView  implements EntityMetadata {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Ksuid id;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Ksuid flowId;

    @JsonProperty
    @NotEmpty
    private String displayName;

    @JsonProperty
    private TriggerMetadataView trigger;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Set<ErrorResponse> errors;

    @JsonProperty
    private boolean valid;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY)
    private EditState state;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long created;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long updated;

    public Set<ErrorResponse> getErrors(){
        if(Objects.isNull(errors)){
            return new HashSet<>();
        }
        return new HashSet<>(errors);
    }
}
