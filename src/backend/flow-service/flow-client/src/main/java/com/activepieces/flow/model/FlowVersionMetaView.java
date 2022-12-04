package com.activepieces.flow.model;

import com.activepieces.common.EntityMetadata;
import com.activepieces.entity.enums.EditState;
import com.activepieces.entity.subdocuments.field.Variable;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class FlowVersionMetaView implements EntityMetadata {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Ksuid id;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Ksuid flowId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String displayName;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY)
    private EditState state;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private List<@Valid Variable<?>> configs;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY)
    private long created;

    @JsonProperty(access= JsonProperty.Access.READ_ONLY)
    private long updated;

}
