package com.activepieces.file.service;

import com.activepieces.entity.sql.FileEntity;
import com.github.ksuid.Ksuid;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public interface FileService {

    FileEntity save(String name, MultipartFile file) throws IOException;

    Optional<FileEntity> getFile(String name);

    Optional<FileEntity> getFileById(Ksuid id);

}
