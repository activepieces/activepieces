package com.activepieces.piece.server.repository;

import com.activepieces.common.pagination.PaginationRepository;
import com.activepieces.entity.sql.Collection;
import com.github.ksuid.Ksuid;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository("CollectionRepository")
public interface CollectionRepository extends CrudRepository<Collection, Ksuid>, PaginationRepository<Collection, Ksuid> {


}
