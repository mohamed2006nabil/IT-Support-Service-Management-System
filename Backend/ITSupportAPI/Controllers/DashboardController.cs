using ITSupportAPI.Data;
using ITSupportAPI.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/dashboard
    [HttpGet]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary()
    {
        var userSummary = new UserSummaryDto
        {
            Total = await _context.Users.CountAsync(),

            Employees = await _context.Users
                .CountAsync(u => u.Role != null && u.Role.Name == "Employee"),

            ITAgents = await _context.Users
                .CountAsync(u => u.Role != null && u.Role.Name == "IT Agent"),

            Admins = await _context.Users
                .CountAsync(u => u.Role != null && u.Role.Name == "Admin"),

            Active = await _context.Users
                .CountAsync(u => u.IsActive)
        };

        var ticketSummary = new TicketSummaryDto
        {
            Total = await _context.Tickets.CountAsync(),

            Open = await _context.Tickets
                .CountAsync(t => t.Status != null && t.Status.Name == "Open"),

            InProgress = await _context.Tickets
                .CountAsync(t => t.Status != null && t.Status.Name == "In Progress"),

            Resolved = await _context.Tickets
                .CountAsync(t => t.Status != null && t.Status.Name == "Resolved"),

            Closed = await _context.Tickets
                .CountAsync(t => t.Status != null && t.Status.Name == "Closed"),

            Reopened = await _context.Tickets
                .CountAsync(t => t.Status != null && t.Status.Name == "Reopened")
        };

        var recentTickets = await _context.Tickets
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.Status)
            .Include(t => t.Priority)
            .Include(t => t.Category)
            .OrderByDescending(t => t.CreatedAt)
            .Take(8)
            .Select(t => new RecentTicketDto
            {
                Id = t.Id,
                Title = t.Title,
                Status = t.Status!.Name,
                Priority = t.Priority!.Name,
                Category = t.Category!.Name,
                CreatedBy = t.User!.FullName,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        var ticketsByPriority = await _context.Tickets
            .AsNoTracking()
            .GroupBy(t => t.Priority!.Name)
            .Select(g => new DashboardBreakdownDto
            {
                Name = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        var ticketsByCategory = await _context.Tickets
            .AsNoTracking()
            .GroupBy(t => t.Category!.Name)
            .Select(g => new DashboardBreakdownDto
            {
                Name = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(8)
            .ToListAsync();

        var recentActivity = await _context.TicketHistories
            .AsNoTracking()
            .Include(h => h.User)
            .Include(h => h.OldStatus)
            .Include(h => h.NewStatus)
            .OrderByDescending(h => h.CreatedAt)
            .Take(10)
            .Select(h => new RecentActivityDto
            {
                TicketId = h.TicketId,
                Action = h.Action,
                OldValue = h.OldStatus != null
                    ? h.OldStatus.Name
                    : null,
                NewValue = h.NewStatus != null
                    ? h.NewStatus.Name
                    : null,
                PerformedBy = h.User.FullName,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync();

        var dashboard = new DashboardSummaryDto
        {
            Users = userSummary,
            Tickets = ticketSummary,
            RecentTickets = recentTickets,
            TicketsByPriority = ticketsByPriority,
            TicketsByCategory = ticketsByCategory,
            RecentActivity = recentActivity
        };

        return Ok(dashboard);
    }
}