package com.activepieces.file.controller;

        import com.activepieces.entity.sql.FileEntity;
        import com.activepieces.file.service.FileService;
        import com.github.ksuid.Ksuid;
        import io.swagger.v3.oas.annotations.Hidden;
        import jdk.jfr.ContentType;
        import org.springframework.beans.factory.annotation.Autowired;
        import org.springframework.core.io.ByteArrayResource;
        import org.springframework.http.ContentDisposition;
        import org.springframework.http.HttpHeaders;
        import org.springframework.http.MediaType;
        import org.springframework.http.ResponseEntity;
        import org.springframework.stereotype.Controller;
        import org.springframework.web.bind.annotation.GetMapping;
        import org.springframework.web.bind.annotation.PathVariable;
        import org.springframework.web.bind.annotation.ResponseBody;
        import org.springframework.web.bind.annotation.RestController;

        import javax.servlet.http.HttpServletResponse;
        import java.io.ByteArrayOutputStream;
        import java.io.IOException;
        import java.io.OutputStream;
        import java.util.Optional;

@Controller
@Hidden
public class FileController {


    private final FileService fileService;

    @Autowired
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }


    @GetMapping(value = "/files/{id}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @ResponseBody
    public void getFile(@PathVariable Ksuid id, HttpServletResponse response) throws IOException {
        Optional<FileEntity> fileEntityOptional = fileService.getFileById(id);
        FileEntity fileEntity = fileEntityOptional.get();
        ByteArrayOutputStream out = new ByteArrayOutputStream(fileEntity.getData().length);
        out.write(fileEntity.getData(), 0, fileEntity.getData().length);
        response.addIntHeader("Content-Length", fileEntity.getData().length);
        response.addHeader("Content-Disposition", "attachment; filename=artifact.zip");
        OutputStream outputStream = response.getOutputStream();
        out.writeTo(outputStream);
        outputStream.close();
        out.close();
    }
}
