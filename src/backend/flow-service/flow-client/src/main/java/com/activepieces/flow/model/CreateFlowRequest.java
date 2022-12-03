package com.activepieces.flow.model;

import com.activepieces.common.validation.constraints.CodeNameConstraints;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder(toBuilder = true)
public class CreateFlowRequest {

    @JsonProperty @NotNull @Valid
    private FlowVersionView version;

}
