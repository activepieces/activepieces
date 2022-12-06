package com.activepieces.file.service;

import com.activepieces.entity.sql.FileEntity;
import com.activepieces.file.repository.FileRepository;
import com.github.ksuid.Ksuid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;
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
    public FileEntity clone(Ksuid id) {
        Optional<FileEntity> file = fileRepository.findById(id);
        return file.map(fileEntity -> fileRepository.save(fileEntity.toBuilder().id(Ksuid.newKsuid()).build())).orElse(null);
    }

    @Override
    public FileEntity save(Ksuid fileId, MultipartFile file) throws IOException {
        FileEntity.FileEntityBuilder fileEntity = FileEntity.builder().id(Ksuid.newKsuid());
        if(Objects.nonNull(fileId)) {
            Optional<FileEntity> fn = fileRepository.findById(fileId);
            if (fn.isPresent()) {
                fileEntity = fn.get().toBuilder();
            }
        }
        return fileRepository.save(fileEntity
                .contentType(file.getContentType())
                .data(file.getBytes())
                .size(file.getSize())
                .build());
    }

    @Override
    public Optional<FileEntity> getFileById(Ksuid id) {
        return fileRepository.findById(id);
    }

    @Override
    public void delete(Ksuid id) {
        fileRepository.deleteById(id);
    }

}
