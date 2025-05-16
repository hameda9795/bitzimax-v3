package com.bitzomax.repository;

import com.bitzomax.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User entity operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find a user by their username
     * @param username the username to search for
     * @return the user with the specified username
     */
    Optional<User> findByUsername(String username);
    
    /**
     * Find a user by their email
     * @param email the email to search for
     * @return the user with the specified email
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if a username already exists
     * @param username the username to check
     * @return true if the username exists, false otherwise
     */
    boolean existsByUsername(String username);
    
    /**
     * Check if an email already exists
     * @param email the email to check
     * @return true if the email exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Find users with pagination support
     * @param pageable pagination information
     * @return page of users
     */
    Page<User> findAll(Pageable pageable);
    
    /**
     * Find users by subscription status
     * @param isSubscribed the subscription status to filter by
     * @return list of users with the specified subscription status
     */
    List<User> findByIsSubscribed(boolean isSubscribed);
    
    /**
     * Find users who joined within a date range
     * @param startDate the start date of the range
     * @param endDate the end date of the range
     * @return list of users who joined within the date range
     */
    List<User> findByJoinDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Search users by username or display name containing the search term
     * @param searchTerm the term to search for in username or display name
     * @return list of users matching the search term
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchByUsernameOrDisplayName(@Param("searchTerm") String searchTerm);
    
    /**
     * Find users ordered by join date (newest first)
     * @return list of users ordered by join date descending
     */
    List<User> findAllByOrderByJoinDateDesc();
}
