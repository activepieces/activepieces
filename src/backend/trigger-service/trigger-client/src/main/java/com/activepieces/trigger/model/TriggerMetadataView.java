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
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property="type", visible = true, defaultImpl = EmptyTriggerMetadataView.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = ScheduleMetadataTriggerView.class, name = "SCHEDULE"),
        @JsonSubTypes.Type(value = EmptyTriggerMetadataView.class, name = "EMPTY"),
        @JsonSubTypes.Type(value = InstanceStartedTriggerMetadataView.class, name = "COLLECTED_DEPLOYED"),
        @JsonSubTypes.Type(value = InstanceStoppedTriggerMetadataView.class, name = "COLLECTION_STOPPED"),
        @JsonSubTypes.Type(value = WebhookTriggerMetadataView.class, name = "WEBHOOK")
}
)
@ToString
@EqualsAndHashCode
public abstract class TriggerMetadataView implements Serializable {

    @Pattern(regexp = "SCHEDULE|EMPTY|WEBHOOK|COLLECTED_DEPLOYED|COLLECTION_STOPPED")
    @JsonProperty
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
