package com.bitzomax.controller;

import com.bitzomax.model.Subscription;
import com.bitzomax.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for handling subscription-related endpoints
 */
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {
    
    private final SubscriptionService subscriptionService;
    
    @Autowired
    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }
    
    /**
     * Check subscription status
     * GET /subscriptions/status
     * 
     * @param userId the authenticated user ID (from auth token)
     * @return subscription status information
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkSubscriptionStatus(
            @RequestHeader("X-User-ID") Long userId) {
        boolean isSubscribed = subscriptionService.isSubscribed(userId);
        int daysRemaining = subscriptionService.getDaysRemaining(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("isSubscribed", isSubscribed);
        response.put("daysRemaining", daysRemaining);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Subscribe to the monthly plan
     * POST /subscriptions
     * 
     * @param userId the authenticated user ID (from auth token)
     * @return the created subscription
     */
    @PostMapping
    public ResponseEntity<Subscription> subscribe(
            @RequestHeader("X-User-ID") Long userId) {
        Subscription subscription = subscriptionService.subscribe(userId);
        return ResponseEntity.ok(subscription);
    }
    
    /**
     * Cancel subscription
     * DELETE /subscriptions
     * 
     * @param userId the authenticated user ID (from auth token)
     * @return success status
     */
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> cancelSubscription(
            @RequestHeader("X-User-ID") Long userId) {
        boolean success = subscriptionService.cancelSubscription(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        if (success) {
            response.put("message", "Subscription cancelled successfully. Your access will continue until the end of the current billing period.");
        } else {
            response.put("message", "No active subscription found.");
        }
        
        return ResponseEntity.ok(response);
    }
}
