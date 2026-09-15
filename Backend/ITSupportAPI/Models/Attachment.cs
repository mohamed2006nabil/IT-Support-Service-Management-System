using System;
using System.Collections.Generic;

namespace ITSupportAPI.Models;

public partial class Attachment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public int UploadedById { get; set; }

    public string FileName { get; set; } = null!;

    public string FilePath { get; set; } = null!;

    public string? FileType { get; set; }

    public long? FileSize { get; set; }

    public DateTime UploadedAt { get; set; }

    public virtual Ticket Ticket { get; set; } = null!;

    public virtual User UploadedBy { get; set; } = null!;
}
