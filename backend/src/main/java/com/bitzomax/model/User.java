package com.bitzomax.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Column(unique = true)
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(unique = true)
    private String email;
    
    @NotBlank(message = "Display name is required")
    private String displayName;
    
    private String avatarUrl;
    
    @CreationTimestamp
    private LocalDateTime joinDate;
    
    private Boolean isSubscribed = false;
      // Relationships
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WatchHistory> watchHistory = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FavoriteVideo> favoriteVideos = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LikedVideo> likedVideos = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Subscription> subscriptions = new ArrayList<>();
}
