package com.bitzomax.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Subscription plan is required")
    private Plan plan;
    
    @NotNull(message = "Subscription start date is required")
    private LocalDateTime startDate;
    
    @NotNull(message = "Subscription end date is required")
    private LocalDateTime endDate;
    
    private Boolean autoRenew = true;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @NotNull(message = "Price is required")
    private BigDecimal price;
    
    // Enums
    public enum Plan {
        MONTHLY, YEARLY
    }
}
