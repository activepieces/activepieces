package com.activepieces.common.utils;

import lombok.experimental.UtilityClass;

import java.time.Instant;

@UtilityClass
public class TimeUtils {

    public static long getEpochTimeInMillis(){
        return Instant.now().toEpochMilli();
    }
}
