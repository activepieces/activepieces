package com.activepieces.common.pagination;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Function;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
public class SeekPage<T> {

    private Cursor previous;
    private Cursor next;
    private List<T> data;

    public SeekPage(List<T> data,  Cursor previous,Cursor next) {
        this.previous = previous;
        this.next = next;
        this.data = data;
    }


    public <S> SeekPage<S> convert(Function<T, S> function) {
        return new SeekPage<>(
                data.stream()
                        .map(function)
                        .collect(Collectors.toCollection(CopyOnWriteArrayList::new)),
                previous, next);
    }

}

