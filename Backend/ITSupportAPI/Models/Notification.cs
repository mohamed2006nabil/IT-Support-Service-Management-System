using System;
using System.Collections.Generic;

namespace ITSupportAPI.Models;

public partial class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? TicketId { get; set; }

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Ticket? Ticket { get; set; }

    public virtual User User { get; set; } = null!;
}
