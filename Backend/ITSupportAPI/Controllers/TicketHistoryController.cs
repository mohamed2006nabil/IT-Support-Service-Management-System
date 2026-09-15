using ITSupportAPI.Data;
using ITSupportAPI.DTOs.TicketHistory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketHistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TicketHistoryController(ApplicationDbContext context)
    {
        _context = context;
    }


    // ========================================
    // GET: api/tickethistory
    // ========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketHistoryResponseDto>>> GetTicketHistory()
    {
        var query = _context.TicketHistories
            .AsNoTracking()
            .AsQueryable();


        // ========================================
        // IT Agent
        // Only see history for tickets assigned
        // to the currently logged-in agent
        // ========================================

        if (User.IsInRole("IT Agent"))
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;


            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }


            query = query.Where(
                h => _context.Tickets.Any(
                    t =>
                        t.Id == h.TicketId &&
                        t.AssignedToId == userId
                )
            );
        }


        // ========================================
        // Admin
        // Can see all ticket history
        // ========================================


        var history = await query
            .Select(h => new TicketHistoryResponseDto
            {
                Id = h.Id,

                TicketId = h.TicketId,

                UserId = h.UserId,

                UserName = h.User.FullName,

                OldStatusId = h.OldStatusId,

                OldStatusName =
                    h.OldStatus != null
                        ? h.OldStatus.Name
                        : null,

                NewStatusId = h.NewStatusId,

                NewStatusName =
                    h.NewStatus != null
                        ? h.NewStatus.Name
                        : null,

                Action = h.Action,

                Notes = h.Notes,

                CreatedAt = h.CreatedAt
            })
            .ToListAsync();


        return Ok(history);
    }


    // ========================================
    // GET: api/tickethistory/{id}
    // ========================================

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketHistoryResponseDto>> GetTicketHistoryById(int id)
    {
        var query = _context.TicketHistories
            .AsNoTracking()
            .Where(
                h => h.Id == id
            );


        // ========================================
        // IT Agent
        // Only access history for tickets assigned
        // to the currently logged-in agent
        // ========================================

        if (User.IsInRole("IT Agent"))
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;


            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }


            query = query.Where(
                h => _context.Tickets.Any(
                    t =>
                        t.Id == h.TicketId &&
                        t.AssignedToId == userId
                )
            );
        }


        var history = await query
            .Select(h => new TicketHistoryResponseDto
            {
                Id = h.Id,

                TicketId = h.TicketId,

                UserId = h.UserId,

                UserName = h.User.FullName,

                OldStatusId = h.OldStatusId,

                OldStatusName =
                    h.OldStatus != null
                        ? h.OldStatus.Name
                        : null,

                NewStatusId = h.NewStatusId,

                NewStatusName =
                    h.NewStatus != null
                        ? h.NewStatus.Name
                        : null,

                Action = h.Action,

                Notes = h.Notes,

                CreatedAt = h.CreatedAt
            })
            .FirstOrDefaultAsync();


        if (history == null)
        {
            return NotFound(new
            {
                message = "Ticket history not found."
            });
        }


        return Ok(history);
    }
}