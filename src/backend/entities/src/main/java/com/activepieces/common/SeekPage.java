package com.activepieces.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Function;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@Setter
public class SeekPage<T> {

  private boolean hasMore;
  private UUID startingAfter;
  private UUID endingBefore;
  private List<T> data;

  public SeekPage(
      UUID startingAfter, UUID endingBefore, org.springframework.data.domain.Slice<T> slice) {
    this.hasMore = slice.hasNext();
    this.data = slice.getContent();
    this.endingBefore = endingBefore;
    this.startingAfter = startingAfter;
  }

  public SeekPage(UUID startingAfter, UUID endingBefore, List<T> data, boolean hasNext) {
    this.hasMore = hasNext;
    this.data = data;
    this.startingAfter = startingAfter;
    this.endingBefore = endingBefore;
  }

  public <S extends EntityMetadata> SeekPage<S> convert(Function<T, S> function) {
    return new SeekPage<>(
        startingAfter,
        endingBefore,
        data.stream()
            .map(function)
            .collect(Collectors.toCollection(CopyOnWriteArrayList::new)),
        hasMore);
  }
}
