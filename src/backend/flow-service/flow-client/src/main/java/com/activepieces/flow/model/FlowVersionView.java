package com.activepieces.flow.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.common.error.ErrorResponse;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.activepieces.trigger.model.TriggerMetadataView;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class FlowVersionView  implements EntityMetadata {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private UUID id;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private UUID flowId;

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

    @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long epochCreationTime;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY) private long epochUpdateTime;

    public Set<ErrorResponse> getErrors(){
        if(Objects.isNull(errors)){
            return new HashSet<>();
        }
        return new HashSet<>(errors);
    }
}
