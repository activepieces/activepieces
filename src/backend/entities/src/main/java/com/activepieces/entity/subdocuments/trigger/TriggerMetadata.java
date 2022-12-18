package com.activepieces.entity.subdocuments.trigger;

import com.activepieces.entity.subdocuments.action.ActionMetadata;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "type", visible = true, defaultImpl = EmptyTriggerMetadata.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = ScheduleTriggerMetadata.class, name = "SCHEDULE"),
        @JsonSubTypes.Type(value = EmptyTriggerMetadata.class, name = "EMPTY"),
        @JsonSubTypes.Type(value = InstanceStartedTriggerMetadata.class, name = "COLLECTION_ENABLED"),
        @JsonSubTypes.Type(value = InstanceStoppedTriggerMetadata.class, name = "COLLECTION_DISABLED"),
        @JsonSubTypes.Type(value = WebhookTriggerMetadata.class, name = "WEBHOOK"),
        @JsonSubTypes.Type(value = ComponentTriggerMetadata.class, name = "COMPONENT_TRIGGER")
}
)
public abstract class TriggerMetadata {

    @JsonProperty
    private String displayName;

    @JsonProperty
    private String type;

    @JsonProperty
    private String name;

    @JsonProperty
    private boolean valid;

    @JsonProperty
    private ActionMetadata nextAction;

}
