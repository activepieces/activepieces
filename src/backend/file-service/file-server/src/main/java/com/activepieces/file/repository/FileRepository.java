package com.activepieces.file.repository;

import com.activepieces.entity.sql.FileEntity;
import com.github.ksuid.Ksuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Ksuid> {

    Optional<FileEntity> findByNameIgnoreCase(String name);
}
