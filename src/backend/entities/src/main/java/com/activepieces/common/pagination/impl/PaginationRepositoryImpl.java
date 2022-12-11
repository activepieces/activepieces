package com.activepieces.common.pagination.impl;

import com.activepieces.common.EntityMetadata;
import com.activepieces.common.pagination.*;
import com.github.ksuid.Ksuid;
import lombok.NonNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.support.JpaEntityInformation;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.util.Assert;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Expression;
import javax.persistence.criteria.Predicate;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.springframework.data.jpa.repository.query.QueryUtils.toOrders;


public class PaginationRepositoryImpl<T extends EntityMetadata, ID> extends SimpleJpaRepository<T, ID>
        implements PaginationRepository<T, ID> {

    private static final String ID = "id";
    private final EntityManager entityManager;

    public PaginationRepositoryImpl(final JpaEntityInformation<T, ID> entityInformation,
                                    final EntityManager entityManager) {
        super(entityInformation, entityManager);
        this.entityManager = entityManager;
    }


    private SeekPage<T> findPage(@NonNull final Sort.Direction direction,
                                 @NonNull final List<PageFilter> filters,
                                 @NonNull final SeekPageRequest request) {
        var sort = Sort.by(direction, ID);
        var domainClass = getDomainClass();
        var criteriaBuilder = entityManager.getCriteriaBuilder();
        var criteriaQuery = criteriaBuilder.createQuery(domainClass);
        Assert.notNull(domainClass, "Domain class must not be null!");
        Assert.notNull(criteriaQuery, "CriteriaQuery must not be null!");
        var root = criteriaQuery.from(domainClass);
        criteriaQuery.select(root);
        for (PageFilter filter : filters) {
            Predicate predicateCondition = null;
            switch (filter.getOperator()) {
                case EQUAL:
                    predicateCondition
                            = criteriaBuilder.equal(root.get(filter.getKey()), filter.getValue());
                    break;
                case NOT_NULL:
                    predicateCondition
                            = criteriaBuilder.isNotNull(root.get(filter.getKey()));
                    break;
            }
            criteriaQuery.where(predicateCondition);
        }

        criteriaQuery.orderBy(toOrders(direction.equals(Sort.Direction.ASC) ? sort.descending() : sort.ascending(), root, criteriaBuilder));
        Optional<T> lastResult = getFirstResult(criteriaQuery);

        criteriaQuery.orderBy(toOrders(sort, root, criteriaBuilder));
        Optional<T> firstResult = getFirstResult(criteriaQuery);

        boolean reverse = false;
        if (Objects.nonNull(request.getCursor())) {
            Expression<Ksuid> expression = root.get(ID).as(Ksuid.class);
            if (direction.isDescending()) {
                if (request.getCursor().getPrefix().equals(PagePrefix.PREV)) {
                    reverse = true;
                    criteriaQuery.where(criteriaBuilder.greaterThan(expression, request.getCursor().getId()));
                    criteriaQuery.orderBy(toOrders(sort.ascending(), root, criteriaBuilder));
                } else {
                    criteriaQuery.where(criteriaBuilder.lessThan(expression, request.getCursor().getId()));
                    criteriaQuery.orderBy(toOrders(sort, root, criteriaBuilder));
                }
            } else {
                if (request.getCursor().getPrefix().equals(PagePrefix.PREV)) {
                    reverse = true;
                    criteriaQuery.where(criteriaBuilder.lessThan(expression, request.getCursor().getId()));
                    criteriaQuery.orderBy(toOrders(sort.descending(), root, criteriaBuilder));
                } else {
                    criteriaQuery.where(criteriaBuilder.greaterThan(expression, request.getCursor().getId()));
                    criteriaQuery.orderBy(toOrders(sort, root, criteriaBuilder));
                }
            }
        }
        TypedQuery<T> typedQuery = entityManager.createQuery(criteriaQuery);
        typedQuery.setMaxResults(request.getLimit());
        List<T> results = typedQuery.getResultList();
        if (reverse) {
            Collections.reverse(results);
        }
        Cursor nextId = null;
        Cursor previousId = null;
        if (results.size() > 0) {
            if (firstResult.isPresent() &&
                    !firstResult.get().getId().equals(results.get(0).getId())) {
                previousId = new Cursor(PagePrefix.PREV,
                        results.get(0).getId());
            }
            if (lastResult.isPresent() && !lastResult.get().getId().equals(
                    results.get(results.size() - 1).getId())) {
                nextId = new Cursor(PagePrefix.NEXT,
                        results.get(results.size() - 1).getId());
            }
        }
        return new SeekPage<T>(results, previousId, nextId);
    }

    private Optional<T> getFirstResult(CriteriaQuery<T> q) {
        TypedQuery<T> firstQuery = entityManager.createQuery(q);
        firstQuery.setMaxResults(1);
        List<T> firstQueryResultList = firstQuery.getResultList();
        return Optional.ofNullable(firstQueryResultList.size() > 0 ? firstQueryResultList.get(0) : null);
    }


    @Override
    public SeekPage<T> findPageDesc(@NonNull List<PageFilter> filters, @NonNull SeekPageRequest request) {
        return findPage(Sort.Direction.DESC, filters, request);
    }

    @Override
    public SeekPage<T> findPageAsc(@NonNull List<PageFilter> filters, @NonNull SeekPageRequest request) {
        return findPage(Sort.Direction.ASC, filters, request);
    }
}
