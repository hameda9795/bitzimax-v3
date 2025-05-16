package com.bitzomax.repository;

import com.bitzomax.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Subscription entity operations
 */
@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    
    /**
     * Find all subscriptions for a user
     * @param userId the user ID to search subscriptions for
     * @return list of subscriptions for the specified user
     */
    List<Subscription> findByUserId(Long userId);
    
    /**
     * Find active subscriptions for a user (end date is after current date)
     * @param userId the user ID to search active subscriptions for
     * @param currentDate the current date to compare with subscription end date
     * @return list of active subscriptions for the specified user
     */
    List<Subscription> findByUserIdAndEndDateAfter(Long userId, LocalDateTime currentDate);
    
    /**
     * Find subscriptions set for auto renewal
     * @param autoRenew auto renewal status
     * @return list of subscriptions set for auto renewal
     */
    List<Subscription> findByAutoRenew(boolean autoRenew);
    
    /**
     * Find subscriptions by plan type
     * @param plan the subscription plan type
     * @return list of subscriptions with the specified plan
     */
    List<Subscription> findByPlan(Subscription.Plan plan);
}
