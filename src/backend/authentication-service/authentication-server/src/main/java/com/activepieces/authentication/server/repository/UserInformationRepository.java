package com.activepieces.authentication.server.repository;

import com.activepieces.entity.sql.UserInformation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository()
public interface UserInformationRepository
        extends CrudRepository<UserInformation, UUID> {

  Optional<UserInformation> findByEmailIgnoreCase(String email);
}
