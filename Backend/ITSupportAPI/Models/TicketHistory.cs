using System;
using System.Collections.Generic;

namespace ITSupportAPI.Models;

public partial class TicketHistory
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public int UserId { get; set; }

    public int? OldStatusId { get; set; }

    public int? NewStatusId { get; set; }

    public string Action { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Status? NewStatus { get; set; }

    public virtual Status? OldStatus { get; set; }

    public virtual Ticket Ticket { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
