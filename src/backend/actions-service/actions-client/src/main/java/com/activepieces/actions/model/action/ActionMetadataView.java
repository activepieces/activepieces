package com.activepieces.actions.model.action;

import com.activepieces.common.validation.CodeNameConstraints;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import java.io.Serializable;

@Getter
@SuperBuilder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type",
        defaultImpl = EmptyActionMetadataView.class,
        visible = true)
@JsonSubTypes({
  @JsonSubTypes.Type(value = CodeActionMetadataView.class, name = "CODE"),
  @JsonSubTypes.Type(value = StorageActionMetadataView.class, name = "STORAGE"),
  @JsonSubTypes.Type(value = ResponseActionMetadataView.class, name = "RESPONSE"),
  @JsonSubTypes.Type(value = LoopOnItemsActionMetadataView.class, name = "LOOP_ON_ITEMS"),
        @JsonSubTypes.Type(value = ComponentActionMetadataView.class, name = "COMPONENT")
})
public abstract class ActionMetadataView implements Serializable {

  @Pattern(regexp = "CODE|STORAGE|RESPONSE|LOOP_ON_ITEMS|COMPONENT")
  @JsonProperty
  private String type;

  @JsonProperty
  @NotEmpty
  @NotNull
  private String displayName;

  @JsonProperty
  @CodeNameConstraints
  private String name;
  ;

  @JsonProperty
  private ActionMetadataView nextAction;

  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private boolean valid;

  public abstract ActionMetadataViewBuilder<?, ?> toBuilder();

  public void setValid(boolean valid) {
    this.valid = valid;
  }
}
