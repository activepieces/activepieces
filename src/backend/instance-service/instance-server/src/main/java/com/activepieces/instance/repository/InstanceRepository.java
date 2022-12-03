package com.activepieces.instance.repository;

import com.activepieces.common.pagination.PaginationRepository;
import com.activepieces.entity.sql.Instance;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository("InstanceRepository")
public interface InstanceRepository extends CrudRepository<Instance, Ksuid>, PaginationRepository<Instance, Ksuid> {



}
