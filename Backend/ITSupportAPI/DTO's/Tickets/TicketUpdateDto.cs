using System.ComponentModel.DataAnnotations;

namespace ITSupportAPI.DTOs.Tickets;

public class TicketUpdateDto
{
    [Required]
    [MinLength(3)]
    public string Title { get; set; } = null!;

    [Required]
    [MinLength(5)]
    public string Description { get; set; } = null!;

    public int UserId { get; set; }

    public int? AssignedToId { get; set; }

    public int CategoryId { get; set; }

    public int PriorityId { get; set; }

    public int StatusId { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }
}