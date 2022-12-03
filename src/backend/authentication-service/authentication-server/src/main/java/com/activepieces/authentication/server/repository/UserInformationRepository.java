package com.activepieces.authentication.server.repository;

import com.activepieces.entity.sql.UserInformation;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository()
public interface UserInformationRepository
        extends CrudRepository<UserInformation, Ksuid> {

  Optional<UserInformation> findByEmailIgnoreCase(String email);
}
