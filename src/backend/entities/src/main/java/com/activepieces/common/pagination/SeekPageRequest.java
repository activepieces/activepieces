package com.activepieces.common.pagination;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@Getter
@AllArgsConstructor
@ToString
public class SeekPageRequest{

    private Cursor cursor;
    private int limit;

}
