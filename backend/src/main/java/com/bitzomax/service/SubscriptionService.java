package com.bitzomax.service;

import com.bitzomax.model.Subscription;
import com.bitzomax.model.User;
import com.bitzomax.repository.SubscriptionRepository;
import com.bitzomax.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service class for Subscription-related operations
 */
@Service
public class SubscriptionService {
    
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public SubscriptionService(SubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Check if a user is currently subscribed
     * 
     * @param userId the user ID to check
     * @return true if the user has an active subscription, false otherwise
     */
    public boolean isSubscribed(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubscriptions = subscriptionRepository.findByUserIdAndEndDateAfter(userId, now);
        return !activeSubscriptions.isEmpty();
    }
    
    /**
     * Subscribe a user to the monthly plan
     * 
     * @param userId the user ID to subscribe
     * @return the created subscription
     */
    @Transactional
    public Subscription subscribe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        // Create a new subscription
        Subscription subscription = new Subscription();
        subscription.setUser(user);
        subscription.setPlan(Subscription.Plan.MONTHLY);
        subscription.setStartDate(LocalDateTime.now());
        
        // Set end date to one month from now
        LocalDateTime endDate = LocalDateTime.now().plusMonths(1);
        subscription.setEndDate(endDate);
        
        subscription.setAutoRenew(true);
        subscription.setPrice(new BigDecimal("6.00")); // Monthly plan price: €6
        
        Subscription savedSubscription = subscriptionRepository.save(subscription);
        
        // Update user's subscription status
        user.setIsSubscribed(true);
        userRepository.save(user);
        
        return savedSubscription;
    }
    
    /**
     * Cancel a user's subscription
     * 
     * @param userId the user ID whose subscription to cancel
     * @return true if cancelled successfully, false if no active subscription found
     */
    @Transactional
    public boolean cancelSubscription(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubscriptions = subscriptionRepository.findByUserIdAndEndDateAfter(userId, now);
        
        if (activeSubscriptions.isEmpty()) {
            return false; // No active subscription to cancel
        }
        
        // Get the most recent active subscription
        Subscription currentSubscription = activeSubscriptions.stream()
                .max((s1, s2) -> s1.getEndDate().compareTo(s2.getEndDate()))
                .orElseThrow();
        
        // Turn off auto-renewal but let the subscription run its course
        currentSubscription.setAutoRenew(false);
        subscriptionRepository.save(currentSubscription);
        
        // Note: we don't set user.isSubscribed to false yet since they still have access until the end date
        
        return true;
    }
    
    /**
     * Get the number of days remaining in the user's subscription
     * 
     * @param userId the user ID to check
     * @return the number of days remaining in the subscription, or 0 if not subscribed
     */
    public int getDaysRemaining(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubscriptions = subscriptionRepository.findByUserIdAndEndDateAfter(userId, now);
        
        if (activeSubscriptions.isEmpty()) {
            return 0; // No active subscription
        }
        
        // Get the subscription with the furthest end date
        Subscription currentSubscription = activeSubscriptions.stream()
                .max((s1, s2) -> s1.getEndDate().compareTo(s2.getEndDate()))
                .orElseThrow();
        
        // Calculate days between now and end date
        return (int) ChronoUnit.DAYS.between(now, currentSubscription.getEndDate());
    }
}
