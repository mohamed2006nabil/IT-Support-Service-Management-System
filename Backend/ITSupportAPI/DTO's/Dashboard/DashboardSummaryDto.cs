namespace ITSupportAPI.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public UserSummaryDto Users { get; set; } = new();

    public TicketSummaryDto Tickets { get; set; } = new();

    public List<RecentTicketDto> RecentTickets { get; set; } = new();

    public List<DashboardBreakdownDto> TicketsByPriority { get; set; } = new();

    public List<DashboardBreakdownDto> TicketsByCategory { get; set; } = new();

    public List<RecentActivityDto> RecentActivity { get; set; } = new();
}

public class UserSummaryDto
{
    public int Total { get; set; }

    public int Employees { get; set; }

    public int ITAgents { get; set; }

    public int Admins { get; set; }

    public int Active { get; set; }
}

public class TicketSummaryDto
{
    public int Total { get; set; }

    public int Open { get; set; }

    public int InProgress { get; set; }

    public int Resolved { get; set; }

    public int Closed { get; set; }

    public int Reopened { get; set; }
}

public class RecentTicketDto
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string Priority { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string CreatedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}

public class DashboardBreakdownDto
{
    public string Name { get; set; } = null!;

    public int Count { get; set; }
}

public class RecentActivityDto
{
    public int TicketId { get; set; }

    public string Action { get; set; } = null!;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public string PerformedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}