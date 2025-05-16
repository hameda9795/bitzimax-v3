package com.bitzomax.service;

import com.bitzomax.model.Genre;

import java.util.List;
import java.util.Optional;

public interface GenreService {
    List<Genre> getAllGenres();
    Optional<Genre> getGenreById(Long id);
    Optional<Genre> getGenreByName(String name);
    Genre createGenre(Genre genre);
    Genre updateGenre(Long id, Genre genreDetails);
    void deleteGenre(Long id);
    boolean existsByName(String name);
} 