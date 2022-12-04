package com.activepieces.trigger.model;

import com.activepieces.actions.model.action.ActionMetadataView;
import com.activepieces.common.validation.CodeNameConstraints;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property="type", visible = true, defaultImpl = EmptyTriggerMetadataView.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = ScheduleMetadataTriggerView.class, name = "SCHEDULE"),
        @JsonSubTypes.Type(value = EmptyTriggerMetadataView.class, name = "EMPTY"),
        @JsonSubTypes.Type(value = InstanceStartedTriggerMetadataView.class, name = "INSTANCE_STARTED"),
        @JsonSubTypes.Type(value = InstanceStoppedTriggerMetadataView.class, name = "INSTANCE_STOPPED"),
        @JsonSubTypes.Type(value = WebhookTriggerMetadataView.class, name = "WEBHOOK"),
        @JsonSubTypes.Type(value = ManualTriggerMetadataView.class, name = "MANUAL"),}
)
@ToString
@EqualsAndHashCode
public abstract class TriggerMetadataView {

    @Pattern(regexp = "MANUAL|EVENT|SCHEDULE|EMPTY|WEBHOOK|INSTANCE_STARTED|INSTANCE_STOPPED")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String type;

    @JsonProperty
    @NotEmpty
    private String displayName;

    @JsonProperty
    @CodeNameConstraints
    private String name;

    @JsonProperty
    private ActionMetadataView nextAction;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private boolean valid;

    public abstract TriggerMetadataViewBuilder<?, ?> toBuilder();


}
