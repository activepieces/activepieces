package com.activepieces.common.pagination;

import com.github.ksuid.Ksuid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PageFilter {

    private String key;
    private PageOperator operator;
    private Ksuid value;

}
