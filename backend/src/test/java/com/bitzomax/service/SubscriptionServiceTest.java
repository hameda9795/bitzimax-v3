package com.bitzomax.service;

import com.bitzomax.model.Subscription;
import com.bitzomax.model.User;
import com.bitzomax.repository.SubscriptionRepository;
import com.bitzomax.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private User testUser;
    private Subscription testSubscription;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();
        
        // Set up test data
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setIsSubscribed(false);
        testUser.setSubscriptions(new ArrayList<>());

        testSubscription = new Subscription();
        testSubscription.setId(1L);
        testSubscription.setUser(testUser);
        testSubscription.setPlan(Subscription.Plan.MONTHLY);
        testSubscription.setStartDate(now);
        testSubscription.setEndDate(now.plusMonths(1));
        testSubscription.setAutoRenew(true);
        testSubscription.setPrice(new BigDecimal("9.99"));
    }

    @Test
    @DisplayName("Should check if user is subscribed")
    void isSubscribed() {
        // Given
        List<Subscription> activeSubscriptions = Arrays.asList(testSubscription);
        when(subscriptionRepository.findByUserIdAndEndDateAfter(eq(1L), any(LocalDateTime.class)))
            .thenReturn(activeSubscriptions);

        // When
        boolean result = subscriptionService.isSubscribed(1L);

        // Then
        assertTrue(result);
        verify(subscriptionRepository, times(1)).findByUserIdAndEndDateAfter(eq(1L), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Should return false when user has no active subscriptions")
    void isSubscribedNoActive() {
        // Given
        when(subscriptionRepository.findByUserIdAndEndDateAfter(eq(1L), any(LocalDateTime.class)))
            .thenReturn(new ArrayList<>());

        // When
        boolean result = subscriptionService.isSubscribed(1L);

        // Then
        assertFalse(result);
        verify(subscriptionRepository, times(1)).findByUserIdAndEndDateAfter(eq(1L), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Should create new subscription for user")
    void subscribe() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription savedSubscription = invocation.getArgument(0);
            savedSubscription.setId(1L);
            return savedSubscription;
        });
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        Subscription result = subscriptionService.subscribe(1L);

        // Then
        assertNotNull(result);
        assertEquals(Subscription.Plan.MONTHLY, result.getPlan());
        assertEquals(1L, result.getUser().getId());
        assertTrue(result.getUser().getIsSubscribed());
        verify(userRepository, times(1)).findById(1L);
        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should throw exception when subscribing non-existent user")
    void subscribeNonExistentUser() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(EntityNotFoundException.class, () -> subscriptionService.subscribe(999L));
        verify(userRepository, times(1)).findById(999L);
        verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should cancel subscription")
    void cancelSubscription() {
        // Given
        testUser.setIsSubscribed(true);
        
        List<Subscription> activeSubscriptions = Arrays.asList(testSubscription);
        when(subscriptionRepository.findByUserIdAndEndDateAfter(eq(1L), any(LocalDateTime.class)))
            .thenReturn(activeSubscriptions);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(testSubscription);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        boolean result = subscriptionService.cancelSubscription(1L);

        // Then
        assertTrue(result);
        assertFalse(testUser.getIsSubscribed());
        assertFalse(testSubscription.getAutoRenew());
        verify(subscriptionRepository, times(1)).findByUserIdAndEndDateAfter(eq(1L), any(LocalDateTime.class));
        verify(userRepository, times(1)).findById(1L);
        verify(subscriptionRepository, times(1)).save(testSubscription);
        verify(userRepository, times(1)).save(testUser);
    }
    
    @Test
    @DisplayName("Should return false when canceling non-existent subscription")
    void cancelNonExistentSubscription() {
        // Given
        when(subscriptionRepository.findByUserIdAndEndDateAfter(eq(999L), any(LocalDateTime.class)))
            .thenReturn(new ArrayList<>());

        // When
        boolean result = subscriptionService.cancelSubscription(999L);

        // Then
        assertFalse(result);
        verify(subscriptionRepository, times(1)).findByUserIdAndEndDateAfter(eq(999L), any(LocalDateTime.class));
        verify(userRepository, never()).findById(anyLong());
    }
}
