package com.activepieces.flow.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
