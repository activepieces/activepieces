package com.activepieces.common;

import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class PaginationService {

  private final MongoTemplate mongoTemplate;

  private static final String CREATION_TIMESTAMP = "epochCreationTime";
  private static final String ID = "id";

  @Autowired
  public PaginationService(@NonNull final MongoTemplate mongoTemplate) {
    this.mongoTemplate = mongoTemplate;
  }

  public <T extends EntityMetadata> SeekPage<T> paginationTimeAsc(
      final AggregateKey aggregateKey,
      final T startingAfter,
      final T endingBefore,
      int limit,
      final Class<T> entity,
      List<Criteria> criteriaList) {
    return paginationTime(
        aggregateKey, startingAfter, endingBefore, limit, entity, true, criteriaList);
  }

  public <T extends EntityMetadata> SeekPage<T> paginationTimeDesc(
      final AggregateKey aggregateKey,
      final T startingAfter,
      final T endingBefore,
      int limit,
      final Class<T> entity,
      List<Criteria> criteriaList) {
    return paginationTime(
        aggregateKey, startingAfter, endingBefore, limit, entity, false, criteriaList);
  }

  public <T extends EntityMetadata> long count(
      final AggregateKey key, List<Criteria> criteriaList, final Class<T> entity) {
    final Query query =
        new Query()
            .addCriteria(new Criteria(key.getAggregateKey()).is(key.getValue()))
            .addCriteria(new Criteria("deleted").is(false));
    for (Criteria criteria : criteriaList) {
      query.addCriteria(criteria);
    }
    return mongoTemplate.count(query, entity);
  }

  private <T extends EntityMetadata> SeekPage<T> paginationTime(
      final AggregateKey aggregateKey,
      final T startingAfter,
      final T endingBefore,
      int limit,
      final Class<T> entity,
      final boolean timestampAsc,
      List<Criteria> criteriaList) {
    Query query =
        construct(aggregateKey, limit + 1, startingAfter, endingBefore, timestampAsc, criteriaList);
    return constructPage(startingAfter, endingBefore, limit, query, entity);
  }

  private <T extends EntityMetadata> SeekPage<T> constructPage(
      final T startingAfter,
      final T endingBefore,
      final int limit,
      @NonNull final Query query,
      @NonNull final Class<T> entity) {
    List<T> result = mongoTemplate.find(query, entity);
    boolean hasMore = result.size() > limit;
    if (hasMore) {
      result.remove(limit);
    }
    UUID startingAfterId = Objects.isNull(startingAfter) ? null : startingAfter.getId();
    UUID endingBeforeId = Objects.isNull(endingBefore) ? null : endingBefore.getId();
    return new SeekPage<>(startingAfterId, endingBeforeId, result, hasMore);
  }

  private <T extends EntityMetadata> Query construct(
      AggregateKey key,
      int limit,
      T startingAfter,
      T endingBefore,
      boolean timestampAsc,
      List<Criteria> criteriaList) {
    final Query query =
        new Query()
            .limit(limit)
            .with(
                Sort.by(
                    new Sort.Order(
                        timestampAsc ? Sort.Direction.ASC : Sort.Direction.DESC,
                        CREATION_TIMESTAMP),
                    new Sort.Order(Sort.Direction.DESC, ID)))
            .addCriteria(new Criteria(key.getAggregateKey()).is(key.getValue()))
            .addCriteria(new Criteria("deleted").is(false));
    for (Criteria criteria : criteriaList) {
      query.addCriteria(criteria);
    }
    if (Objects.nonNull(endingBefore)) {
      Criteria timestampCriteria =
          !timestampAsc
              ? new Criteria(CREATION_TIMESTAMP).gt(endingBefore.getEpochCreationTime())
              : new Criteria(CREATION_TIMESTAMP).lt(endingBefore.getEpochCreationTime());
      Criteria criteria =
          new Criteria(CREATION_TIMESTAMP)
              .is(endingBefore.getEpochCreationTime())
              .and(ID)
              .gt(endingBefore.getId());
      return query.addCriteria(new Criteria().orOperator(criteria, timestampCriteria));
    }
    if (Objects.nonNull(startingAfter)) {
      Criteria timestampCriteria =
          timestampAsc
              ? new Criteria(CREATION_TIMESTAMP).gt(startingAfter.getEpochCreationTime())
              : new Criteria(CREATION_TIMESTAMP).lt(startingAfter.getEpochCreationTime());
      Criteria criteria =
          new Criteria(CREATION_TIMESTAMP)
              .is(startingAfter.getEpochCreationTime())
              .and(ID)
              .lt(startingAfter.getId());
      return query.addCriteria(new Criteria().orOperator(criteria, timestampCriteria));
    }
    return query;
  }
}
