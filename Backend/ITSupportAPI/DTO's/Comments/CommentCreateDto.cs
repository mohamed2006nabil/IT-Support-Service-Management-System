namespace ITSupportAPI.DTOs.Comments;

public class CommentCreateDto
{
    public int TicketId { get; set; }

    public int UserId { get; set; }

    public string CommentText { get; set; } = null!;
}