using System.ComponentModel.DataAnnotations;

namespace ITSupportAPI.DTOs.Tickets;

public class TicketCreateDto
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
}