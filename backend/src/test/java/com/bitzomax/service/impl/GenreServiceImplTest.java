package com.bitzomax.service.impl;

import com.bitzomax.model.Genre;
import com.bitzomax.repository.GenreRepository;
import com.bitzomax.service.GenreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GenreServiceImplTest {

    @Mock
    private GenreRepository genreRepository;

    @InjectMocks
    private GenreServiceImpl genreService;

    private Genre testGenre;
    private List<Genre> genreList;

    @BeforeEach
    void setUp() {
        // Set up test data
        testGenre = new Genre();
        testGenre.setId(1L);
        testGenre.setName("Rock");
        testGenre.setDescription("Rock music genre");

        Genre testGenre2 = new Genre();
        testGenre2.setId(2L);
        testGenre2.setName("Pop");
        testGenre2.setDescription("Pop music genre");

        genreList = Arrays.asList(testGenre, testGenre2);
    }

    @Test
    @DisplayName("Should return all genres")
    void getAllGenres() {
        // Given
        when(genreRepository.findAll()).thenReturn(genreList);

        // When
        List<Genre> result = genreService.getAllGenres();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Rock", result.get(0).getName());
        verify(genreRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should find genre by ID")
    void getGenreById() {
        // Given
        when(genreRepository.findById(1L)).thenReturn(Optional.of(testGenre));

        // When
        Optional<Genre> result = genreService.getGenreById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals("Rock", result.get().getName());
        verify(genreRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should find genre by name")
    void getGenreByName() {
        // Given
        when(genreRepository.findByName("Rock")).thenReturn(Optional.of(testGenre));

        // When
        Optional<Genre> result = genreService.getGenreByName("Rock");

        // Then
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        verify(genreRepository, times(1)).findByName("Rock");
    }

    @Test
    @DisplayName("Should create new genre")
    void createGenre() {
        // Given
        when(genreRepository.save(any(Genre.class))).thenReturn(testGenre);

        // When
        Genre result = genreService.createGenre(testGenre);

        // Then
        assertNotNull(result);
        assertEquals("Rock", result.getName());
        verify(genreRepository, times(1)).save(testGenre);
    }

    @Test
    @DisplayName("Should update existing genre")
    void updateGenre() {
        // Given
        Genre updatedGenre = new Genre();
        updatedGenre.setName("Rock Updated");
        updatedGenre.setDescription("Updated description");

        when(genreRepository.findById(1L)).thenReturn(Optional.of(testGenre));
        when(genreRepository.save(any(Genre.class))).thenAnswer(invocation -> {
            Genre savedGenre = invocation.getArgument(0);
            savedGenre.setId(1L);
            return savedGenre;
        });

        // When
        Genre result = genreService.updateGenre(1L, updatedGenre);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Rock Updated", result.getName());
        assertEquals("Updated description", result.getDescription());
        verify(genreRepository, times(1)).findById(1L);
        verify(genreRepository, times(1)).save(any(Genre.class));
    }

    @Test
    @DisplayName("Should throw RuntimeException when updating non-existent genre")
    void updateGenreNotFound() {
        // Given
        when(genreRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(RuntimeException.class, () -> genreService.updateGenre(999L, new Genre()));
        verify(genreRepository, times(1)).findById(999L);
        verify(genreRepository, never()).save(any(Genre.class));
    }

    @Test
    @DisplayName("Should delete genre")
    void deleteGenre() {
        // Given
        doNothing().when(genreRepository).deleteById(1L);

        // When
        genreService.deleteGenre(1L);

        // Then
        verify(genreRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Should check if genre exists by name")
    void existsByName() {
        // Given
        when(genreRepository.existsByName("Rock")).thenReturn(true);
        when(genreRepository.existsByName("Classical")).thenReturn(false);

        // When
        boolean existsRock = genreService.existsByName("Rock");
        boolean existsClassical = genreService.existsByName("Classical");

        // Then
        assertTrue(existsRock);
        assertFalse(existsClassical);
        verify(genreRepository, times(1)).existsByName("Rock");
        verify(genreRepository, times(1)).existsByName("Classical");
    }
}
