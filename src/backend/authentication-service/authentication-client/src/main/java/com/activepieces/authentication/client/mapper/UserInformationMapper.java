package com.activepieces.authentication.client.mapper;

import com.activepieces.authentication.client.model.UserInformationView;
import com.activepieces.entity.sql.UserInformation;
import org.mapstruct.Mapper;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface UserInformationMapper {

  @Mappings({})
  UserInformation fromView(UserInformationView entity);

  @Mappings({})
  UserInformationView toView(UserInformation entity);



}
