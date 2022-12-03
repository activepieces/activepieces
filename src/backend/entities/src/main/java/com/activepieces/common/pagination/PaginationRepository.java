package com.activepieces.common.pagination;

import lombok.NonNull;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.Repository;

import java.util.List;


@NoRepositoryBean
public interface PaginationRepository<T, ID> extends Repository<T, ID> {

    SeekPage<T> findPageDesc(
                             @NonNull final List<PageFilter> filters,
                             @NonNull final SeekPageRequest maxResults);

    SeekPage<T> findPageAsc(
                            @NonNull final List<PageFilter> filters,
                             @NonNull final SeekPageRequest maxResults);

}
