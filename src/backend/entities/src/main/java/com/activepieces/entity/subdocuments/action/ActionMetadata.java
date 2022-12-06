package com.activepieces.entity.subdocuments.action;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type",
        defaultImpl = EmptyActionMetadata.class,
        visible = true)
@JsonSubTypes({
        @JsonSubTypes.Type(value = CodeActionMetadata.class, name = "CODE"),
        @JsonSubTypes.Type(value = StorageActionMetadata.class, name = "STORAGE"),
        @JsonSubTypes.Type(value = ResponseActionMetadata.class, name = "RESPONSE"),
        @JsonSubTypes.Type(value = LoopOnItemsActionMetadata.class, name = "LOOP_ON_ITEMS"),
        @JsonSubTypes.Type(value = ComponentActionMetadata.class, name = "COMPONENT")
})
public abstract class ActionMetadata {

    @JsonProperty
    private String type;

    @JsonProperty
    private String displayName;

    @JsonProperty
    private String name;

    @JsonProperty
    private ActionMetadata nextAction;

    @JsonProperty
    private boolean valid;

}
