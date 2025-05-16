package com.bitzomax.controller;

import com.bitzomax.dto.GenreDTO;
import com.bitzomax.mapper.GenreMapper;
import com.bitzomax.model.Genre;
import com.bitzomax.service.GenreService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/genres")
public class GenreController {
    
    private static final Logger logger = LoggerFactory.getLogger(GenreController.class);
    
    private final GenreService genreService;
    private final GenreMapper genreMapper;
    
    @Autowired
    public GenreController(GenreService genreService, GenreMapper genreMapper) {
        this.genreService = genreService;
        this.genreMapper = genreMapper;
    }
    
    /**
     * Get all genres
     * GET /api/genres
     * 
     * @return list of all genres
     */
    @GetMapping
    public ResponseEntity<List<GenreDTO>> getAllGenres() {
        logger.info("Fetching all genres");
        List<Genre> genres = genreService.getAllGenres();
        List<GenreDTO> genreDTOs = genres.stream()
                .map(genreMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(genreDTOs);
    }
    
    /**
     * Get genre by ID
     * GET /api/genres/{id}
     * 
     * @param id the genre ID
     * @return the genre with the specified ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<GenreDTO> getGenreById(@PathVariable Long id) {
        logger.info("Fetching genre with id: {}", id);
        Optional<Genre> genreOpt = genreService.getGenreById(id);
        
        return genreOpt.map(genre -> ResponseEntity.ok(genreMapper.toDTO(genre)))
                .orElseGet(() -> {
                    logger.warn("Genre not found with id: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }
    
    /**
     * Get genre by name
     * GET /api/genres/name/{name}
     * 
     * @param name the genre name
     * @return the genre with the specified name
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<GenreDTO> getGenreByName(@PathVariable String name) {
        logger.info("Fetching genre with name: {}", name);
        Optional<Genre> genreOpt = genreService.getGenreByName(name);
        
        return genreOpt.map(genre -> ResponseEntity.ok(genreMapper.toDTO(genre)))
                .orElseGet(() -> {
                    logger.warn("Genre not found with name: {}", name);
                    return ResponseEntity.notFound().build();
                });
    }
    
    /**
     * Create a new genre
     * POST /api/genres
     * 
     * @param genreDTO the genre details
     * @return the created genre
     */
    @PostMapping
    public ResponseEntity<?> createGenre(@Valid @RequestBody GenreDTO genreDTO) {
        logger.info("Creating new genre: {}", genreDTO.getName());
        
        if (genreService.existsByName(genreDTO.getName())) {
            logger.warn("Genre already exists with name: {}", genreDTO.getName());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Genre already exists with name: " + genreDTO.getName());
        }
        
        Genre genre = genreMapper.toEntity(genreDTO);
        Genre savedGenre = genreService.createGenre(genre);
        return new ResponseEntity<>(genreMapper.toDTO(savedGenre), HttpStatus.CREATED);
    }
    
    /**
     * Update a genre
     * PUT /api/genres/{id}
     * 
     * @param id the genre ID
     * @param genreDTO the updated genre details
     * @return the updated genre
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGenre(@PathVariable Long id, @Valid @RequestBody GenreDTO genreDTO) {
        logger.info("Updating genre with id: {}", id);
        
        Optional<Genre> existingGenreOpt = genreService.getGenreById(id);
        if (existingGenreOpt.isEmpty()) {
            logger.warn("Genre not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        
        Genre existingGenre = existingGenreOpt.get();
        
        // Check if name is being changed and if it already exists
        if (!existingGenre.getName().equals(genreDTO.getName()) 
                && genreService.existsByName(genreDTO.getName())) {
            logger.warn("Genre already exists with name: {}", genreDTO.getName());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Genre already exists with name: " + genreDTO.getName());
        }
        
        Genre genreToUpdate = genreMapper.toEntity(genreDTO);
        genreToUpdate.setId(id);
        Genre updatedGenre = genreService.updateGenre(id, genreToUpdate);
        
        return ResponseEntity.ok(genreMapper.toDTO(updatedGenre));
    }
    
    /**
     * Delete a genre
     * DELETE /api/genres/{id}
     * 
     * @param id the genre ID
     * @return success status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        logger.info("Deleting genre with id: {}", id);
        
        if (!genreService.getGenreById(id).isPresent()) {
            logger.warn("Genre not found with id: {}", id);
            return ResponseEntity.notFound().build();
        }
        
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Check if genre exists by name
     * GET /api/genres/exists/{name}
     * 
     * @param name the genre name
     * @return true if genre exists, false otherwise
     */
    @GetMapping("/exists/{name}")
    public ResponseEntity<Boolean> existsByName(@PathVariable String name) {
        logger.info("Checking if genre exists with name: {}", name);
        boolean exists = genreService.existsByName(name);
        return ResponseEntity.ok(exists);
    }
} 