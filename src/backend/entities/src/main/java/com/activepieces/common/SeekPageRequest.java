package com.activepieces.common;

import lombok.*;

import java.util.Objects;
import java.util.UUID;

@Getter
@AllArgsConstructor
@EqualsAndHashCode
@ToString
@NoArgsConstructor
public class SeekPageRequest{

    private UUID startingAfter;
    private UUID endingBefore;
    private int limit;

    public boolean hasStartingAfter(){
        return Objects.nonNull(startingAfter);
    }

    public boolean hasEndingBefore(){
        return Objects.nonNull(endingBefore);
    }

}
