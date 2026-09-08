package com.cslm.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "location_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
