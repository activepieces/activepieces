package com.activepieces.file.service;

import com.activepieces.entity.sql.FileEntity;
import com.github.ksuid.Ksuid;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public interface FileService {

    FileEntity clone(Ksuid id);

    FileEntity save(Ksuid fileId, MultipartFile file) throws IOException;

    Optional<FileEntity> getFileById(Ksuid id);

    void delete(Ksuid id);

}
