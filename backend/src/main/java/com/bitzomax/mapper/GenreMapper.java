package com.bitzomax.mapper;

import com.bitzomax.dto.GenreDTO;
import com.bitzomax.model.Genre;
import org.springframework.stereotype.Component;

@Component
public class GenreMapper {

    public GenreDTO toDTO(Genre genre) {
        if (genre == null) {
            return null;
        }
        
        GenreDTO dto = new GenreDTO();
        dto.setId(genre.getId());
        dto.setName(genre.getName());
        dto.setDescription(genre.getDescription());
        
        return dto;
    }
    
    public Genre toEntity(GenreDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Genre genre = new Genre();
        genre.setId(dto.getId());
        genre.setName(dto.getName());
        genre.setDescription(dto.getDescription());
        
        return genre;
    }
    
    public void updateEntityFromDTO(GenreDTO dto, Genre genre) {
        if (dto == null || genre == null) {
            return;
        }
        
        genre.setName(dto.getName());
        genre.setDescription(dto.getDescription());
    }
} 