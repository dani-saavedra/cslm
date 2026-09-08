package com.cslm.dto;

import java.util.List;
import java.util.Map;

public class GraphDtos {

    public record GraphNode(String id, String label, String type, Map<String, Object> data) {}

    public record GraphEdge(String id, String source, String target, String label) {}

    public record GraphResponse(List<GraphNode> nodes, List<GraphEdge> edges) {}
}
