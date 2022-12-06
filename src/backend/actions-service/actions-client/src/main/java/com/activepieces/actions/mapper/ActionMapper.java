package com.activepieces.actions.mapper;

import com.activepieces.actions.model.action.*;
import com.activepieces.actions.model.action.settings.CodeSettingsView;
import com.activepieces.entity.subdocuments.action.*;
import com.activepieces.entity.subdocuments.action.settings.CodeSettings;
import com.github.ksuid.Ksuid;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;
import org.mapstruct.SubclassMapping;
import org.mapstruct.SubclassMappings;

import java.util.Objects;

import static org.mapstruct.SubclassExhaustiveStrategy.RUNTIME_EXCEPTION;

@Mapper(subclassExhaustiveStrategy = RUNTIME_EXCEPTION, componentModel = "spring")
public abstract class ActionMapper {

  @SubclassMappings({
    @SubclassMapping(source = CodeActionMetadata.class, target = CodeActionMetadataView.class),
    @SubclassMapping(
        source = StorageActionMetadata.class,
        target = StorageActionMetadataView.class),
    @SubclassMapping(
        source = ResponseActionMetadata.class,
        target = ResponseActionMetadataView.class),
    @SubclassMapping(
        source = LoopOnItemsActionMetadata.class,
        target = LoopOnItemsActionMetadataView.class),
    @SubclassMapping(
        source = ComponentActionMetadata.class,
        target = ComponentActionMetadataView.class)
  })
  @Mappings(value = {})
  public abstract ActionMetadataView map(ActionMetadata entity);

  @SubclassMappings({
    @SubclassMapping(source = CodeActionMetadataView.class, target = CodeActionMetadata.class),
    @SubclassMapping(
        source = StorageActionMetadataView.class,
        target = StorageActionMetadata.class),
    @SubclassMapping(
        source = ResponseActionMetadataView.class,
        target = ResponseActionMetadata.class),
    @SubclassMapping(
        source = LoopOnItemsActionMetadataView.class,
        target = LoopOnItemsActionMetadata.class),
    @SubclassMapping(
        source = ComponentActionMetadataView.class,
        target = ComponentActionMetadata.class)
  })
  @Mappings(value = {})
  public abstract ActionMetadata map(ActionMetadataView entity);

  @Mappings(value = {})
  public abstract CodeSettings map(CodeSettingsView entity);

  @Mappings(value = {})
  public abstract CodeSettingsView map(CodeSettings entity);

  @Mappings({})
  public String map(Ksuid ksuid){
    if(Objects.isNull(ksuid)){
      return null;
    }
    return ksuid.toString();
  }

  @Mappings({})
  public Ksuid map(String ksuid){
    if(Objects.isNull(ksuid)){
      return null;
    }
    return Ksuid.fromString(ksuid);
  }

}
