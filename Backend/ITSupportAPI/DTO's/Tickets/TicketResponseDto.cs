namespace ITSupportAPI.DTOs.Tickets;

public class TicketResponseDto
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    // Employee
    public int UserId { get; set; }

    public string UserName { get; set; } = null!;

    // IT Agent
    public int? AssignedToId { get; set; }

    public string? AssignedToName { get; set; }

    // Category
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    // Priority
    public int PriorityId { get; set; }

    public string PriorityName { get; set; } = null!;

    // Status
    public int StatusId { get; set; }

    public string StatusName { get; set; } = null!;

    // Dates
    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }
}