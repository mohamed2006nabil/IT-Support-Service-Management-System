namespace ITSupportAPI.DTOs.Attachments;

public class AttachmentResponseDto
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public int UploadedById { get; set; }
    public string FileName { get; set; } = null!;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}