package com.activepieces.apikey.server.repository;

import com.activepieces.entity.sql.ApiKey;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository()
public interface ApiKeyRepository extends CrudRepository<ApiKey, UUID> {

  Slice<ApiKey> findAllByProjectIdAndEpochCreationTimeGreaterThanOrEpochCreationTimeEqualsAndIdLessThanOrderByEpochCreationTimeAscIdDesc(
          UUID projectId, long epochCreationTime, long epochCreationTimeTwo, UUID startingAfter, Pageable request);

  Slice<ApiKey> findAllByProjectIdOrderByEpochCreationTimeAscIdDesc(UUID projectId,
                                                                          Pageable request);

  Optional<ApiKey> findBySecret(String secret);
}
