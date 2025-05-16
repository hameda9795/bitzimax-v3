package com.bitzomax.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FileUploadExceptionAdvice {

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<Map<String, String>> handleFileStorageException(FileStorageException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "File storage error");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "File size error");
        response.put("message", "File size exceeds the maximum allowed upload size");
        return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED).body(response);
    }
}
