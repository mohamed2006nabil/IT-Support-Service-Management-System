namespace ITSupportAPI.DTOs.Comments;

public class CommentResponseDto
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public int UserId { get; set; }

    public string CommentText { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string? UserName { get; set; }
}