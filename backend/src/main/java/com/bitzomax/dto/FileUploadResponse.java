package com.bitzomax.dto;

public class FileUploadResponse {
    
    private String fileName;
    private String fileType;
    private String filePath;
    private long size;
    private int duration;
    
    public FileUploadResponse() {
    }
    
    public FileUploadResponse(String fileName, String fileType, String filePath, long size) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.filePath = filePath;
        this.size = size;
        this.duration = 0;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }
}
