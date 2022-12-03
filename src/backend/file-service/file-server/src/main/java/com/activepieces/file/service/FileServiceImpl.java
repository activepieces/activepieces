package com.activepieces.file.service;

import com.activepieces.entity.sql.FileEntity;
import com.activepieces.file.repository.FileRepository;
import com.github.ksuid.Ksuid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private final FileRepository fileRepository;

    @Autowired
    public FileServiceImpl(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    @Override
    public FileEntity save(String name, MultipartFile file) throws IOException {
        return fileRepository.save(FileEntity.builder().id(Ksuid.newKsuid()).name(name).contentType(file.getContentType()).data(file.getBytes()).size(file.getSize()).build());
    }

    @Override
    public Optional<FileEntity> getFile(String name) {
        return fileRepository.findByNameIgnoreCase(name);
    }

    @Override
    public Optional<FileEntity> getFileById(Ksuid id) {
        return fileRepository.findById(id);
    }

}
