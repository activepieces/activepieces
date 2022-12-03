package com.activepieces.common.utils;

import lombok.experimental.UtilityClass;
import org.apache.commons.io.FilenameUtils;
import org.springframework.social.InternalServerErrorException;
import org.springframework.web.multipart.MultipartFile;

import javax.xml.bind.annotation.adapters.HexBinaryAdapter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

@UtilityClass
public class HashUtils {

    public static String calculateHash(String string) {
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-256");
            byte[] hash = sha1.digest(string.getBytes(StandardCharsets.UTF_8));
            return new HexBinaryAdapter().marshal(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new InternalServerErrorException(
                    "CodeArtifactService", Arrays.toString(e.getStackTrace()));
        }
    }

    public static String calculateHash(InputStream file) {
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-256");
            try (InputStream input = file) {
                byte[] buffer = new byte[8192];
                int len = input.read(buffer);
                while (len != -1) {
                    sha1.update(buffer, 0, len);
                    len = input.read(buffer);
                }

                return new HexBinaryAdapter().marshal(sha1.digest());
            }
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new InternalServerErrorException(
                    "CodeArtifactService", Arrays.toString(e.getStackTrace()));
        }
    }

    public static String getFileNameAfterUpload(String originalFileName, InputStream file) {
        String extension = FilenameUtils.getExtension(originalFileName);
        return calculateHash(file) + "." + extension;
    }
}
