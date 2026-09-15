namespace ITSupportAPI.DTOs.TicketHistory;

public class TicketHistoryResponseDto
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public int UserId { get; set; }

    public string UserName { get; set; } = null!;

    public int? OldStatusId { get; set; }

    public string? OldStatusName { get; set; }

    public int? NewStatusId { get; set; }

    public string? NewStatusName { get; set; }

    public string Action { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}