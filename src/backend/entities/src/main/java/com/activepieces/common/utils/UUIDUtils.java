package com.activepieces.common.utils;

import java.nio.ByteBuffer;
import java.util.UUID;

public final class UUIDUtils {

    public static boolean isUUID(String uuid){
        try{
            UUID uuid1 = UUID.fromString(uuid);
            return true;
        } catch (IllegalArgumentException exception){
            return false;
        }
    }

    public static Long generateFromUUID(){
        return UUID.randomUUID().getMostSignificantBits() & Long.MAX_VALUE;
    }
}
