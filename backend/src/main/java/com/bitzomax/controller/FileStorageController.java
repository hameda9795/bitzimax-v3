package com.bitzomax.controller;

import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.service.FileStorageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileStorageController {

    private final FileStorageService fileStorageService;

    @Autowired
    public FileStorageController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload/video")
    public ResponseEntity<FileUploadResponse> uploadVideo(@RequestParam("file") MultipartFile file) {
        FileUploadResponse response = fileStorageService.storeVideoFile(file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload/thumbnail")
    public ResponseEntity<FileUploadResponse> uploadThumbnail(@RequestParam("file") MultipartFile file) {
        FileUploadResponse response = fileStorageService.storeThumbnailFile(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/video/{filename}")
    public ResponseEntity<String> getVideoPath(@PathVariable String filename) {
        String path = fileStorageService.getVideoFilePath(filename);
        return ResponseEntity.ok(path);
    }

    @GetMapping("/thumbnail/{filename}")
    public ResponseEntity<String> getThumbnailPath(@PathVariable String filename) {
        String path = fileStorageService.getThumbnailFilePath(filename);
        return ResponseEntity.ok(path);
    }
}
