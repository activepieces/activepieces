package com.activepieces.common.utils;

import lombok.experimental.UtilityClass;
import org.apache.commons.io.FilenameUtils;
import org.springframework.social.InternalServerErrorException;

import javax.xml.bind.annotation.adapters.HexBinaryAdapter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Arrays;

@UtilityClass
public class TimeUtils {

    public static long getEpochTimeInMillis(){
        return Instant.now().toEpochMilli();
    }
}
