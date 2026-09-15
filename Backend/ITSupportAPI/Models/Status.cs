using System;
using System.Collections.Generic;

namespace ITSupportAPI.Models;

public partial class Status
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<TicketHistory> TicketHistoryNewStatuses { get; set; } = new List<TicketHistory>();

    public virtual ICollection<TicketHistory> TicketHistoryOldStatuses { get; set; } = new List<TicketHistory>();

    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
