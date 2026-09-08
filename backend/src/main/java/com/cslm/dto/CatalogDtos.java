package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CatalogDtos {

    public record AssetTypeResponse(Long id, String category, String code, String name, String description, Boolean active) {}

    public record AssetTypeRequest(@NotNull String category, @NotBlank String code, @NotBlank String name,
                                    String description, Boolean active) {}

    public record LocationTypeResponse(Long id, String code, String name, String description, Boolean active) {}

    public record LocationTypeRequest(@NotBlank String code, @NotBlank String name, String description, Boolean active) {}
}
