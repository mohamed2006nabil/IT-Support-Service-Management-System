using ITSupportAPI.Data;
using ITSupportAPI.Models;
using ITSupportAPI.DTOs.Tickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TicketsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/tickets
    // =========================================================
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketResponseDto>>> GetTickets()
    {
        var query = _context.Tickets
            .AsNoTracking();

        // Employee can only see their own tickets
        if (User.IsInRole("Employee"))
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

            query = query.Where(t => t.UserId == userId);
        }

        // IT Agent can only see tickets assigned to them
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

            query = query.Where(t => t.AssignedToId == userId);
        }

        var tickets = await query
            .Select(t => new TicketResponseDto
            {
                Id = t.Id,

                Title = t.Title,

                Description = t.Description,

                // Employee
                UserId = t.UserId,

                UserName = t.User!.FullName,

                // IT Agent
                AssignedToId = t.AssignedToId,

                AssignedToName =
                    t.AssignedTo != null
                        ? t.AssignedTo.FullName
                        : null,

                // Category
                CategoryId = t.CategoryId,

                CategoryName = t.Category!.Name,

                // Priority
                PriorityId = t.PriorityId,

                PriorityName = t.Priority!.Name,

                // Status
                StatusId = t.StatusId,

                StatusName = t.Status!.Name,

                // Dates
                CreatedAt = t.CreatedAt,

                UpdatedAt = t.UpdatedAt,

                ResolvedAt = t.ResolvedAt,

                ClosedAt = t.ClosedAt
            })
            .ToListAsync();

        return Ok(tickets);
    }


    // =========================================================
    // GET: api/tickets/{id}
    // =========================================================
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet("{id}")]
    public async Task<ActionResult<TicketResponseDto>> GetTicket(int id)
    {
        var query = _context.Tickets
            .AsNoTracking()
            .Where(t => t.Id == id);

        // Employee can only access their own ticket
        if (User.IsInRole("Employee"))
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

            query = query.Where(t => t.UserId == userId);
        }

        // IT Agent can only access tickets assigned to them
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

            query = query.Where(t => t.AssignedToId == userId);
        }

        var ticket = await query
            .Select(t => new TicketResponseDto
            {
                Id = t.Id,

                Title = t.Title,

                Description = t.Description,

                // Employee
                UserId = t.UserId,

                UserName = t.User!.FullName,

                // IT Agent
                AssignedToId = t.AssignedToId,

                AssignedToName =
                    t.AssignedTo != null
                        ? t.AssignedTo.FullName
                        : null,

                // Category
                CategoryId = t.CategoryId,

                CategoryName = t.Category!
                .Name,

                // Priority
                PriorityId = t.PriorityId,

                PriorityName = t.Priority!
                .Name,

                // Status
                StatusId = t.StatusId,

                StatusName = t.Status!
                .Name,

                // Dates
                CreatedAt = t.CreatedAt,

                UpdatedAt = t.UpdatedAt,

                ResolvedAt = t.ResolvedAt,

                ClosedAt = t.ClosedAt
            })
            .FirstOrDefaultAsync();

        if (ticket == null)
        {
            return NotFound(new
            {
                message = "Ticket not found."
            });
        }

        return Ok(ticket);
    }


    // =========================================================
    // POST: api/tickets
    // =========================================================
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpPost]
    public async Task<ActionResult<TicketResponseDto>> CreateTicket(
        TicketCreateDto dto)
    {
        // =====================================================
        // Determine ticket owner from the authenticated user
        // =====================================================

        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        // Employees can only create tickets for themselves.
        // Admins and IT Agents may create a ticket for another user.
        var ticketUserId = User.IsInRole("Employee")
            ? currentUserId
            : dto.UserId;

        // Validate User
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == ticketUserId);

        if (!userExists)
        {
            return BadRequest(new
            {
                message = "User not found."
            });
        }

        // Validate Category
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == dto.CategoryId);

        if (!categoryExists)
        {
            return BadRequest(new
            {
                message = "Category not found."
            });
        }

        // Validate Priority
        var priorityExists = await _context.Priorities
            .AnyAsync(p => p.Id == dto.PriorityId);

        if (!priorityExists)
        {
            return BadRequest(new
            {
                message = "Priority not found."
            });
        }

        // Validate Status
        var statusExists = await _context.Statuses
            .AnyAsync(s => s.Id == dto.StatusId);

        if (!statusExists)
        {
            return BadRequest(new
            {
                message = "Status not found."
            });
        }

        // Validate assigned IT Agent
        if (dto.AssignedToId.HasValue)
        {
            var assignedUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(
                    u => u.Id == dto.AssignedToId.Value);

            if (assignedUser == null)
            {
                return BadRequest(new
                {
                    message = "Assigned user not found."
                });
            }

            if (assignedUser.Role?.Name != "IT Agent")
            {
                return BadRequest(new
                {
                    message =
                        "Ticket can only be assigned to an IT Agent."
                });
            }
        }

        var ticket = new Ticket
        {
            Title = dto.Title,
            Description = dto.Description,
            UserId = ticketUserId,
            AssignedToId = dto.AssignedToId,
            CategoryId = dto.CategoryId,
            PriorityId = dto.PriorityId,
            StatusId = dto.StatusId,

            CreatedAt = DateTime.Now,
            UpdatedAt = null,
            ResolvedAt = null,
            ClosedAt = null
        };

        _context.Tickets.Add(ticket);

        await _context.SaveChangesAsync();

        // Create ticket history
        var history = new TicketHistory
        {
            TicketId = ticket.Id,
            UserId = currentUserId,
            OldStatusId = null,
            NewStatusId = ticket.StatusId,
            Action = "Created",
            Notes = "Ticket created.",
            CreatedAt = DateTime.Now
        };

        _context.TicketHistories.Add(history);

        // Create notification for ticket owner
        var notification = new Notification
        {
            UserId = ticket.UserId,
            TicketId = ticket.Id,
            Title = "New Ticket Created",
            Message =
                $"Ticket #{ticket.Id} has been created successfully.",
            IsRead = false,
            CreatedAt = DateTime.Now
        };

        _context.Notifications.Add(notification);

        // Notify assigned IT Agent
        if (ticket.AssignedToId.HasValue)
        {
            var assignmentNotification = new Notification
            {
                UserId = ticket.AssignedToId.Value,
                TicketId = ticket.Id,
                Title = "Ticket Assigned",
                Message =
                    $"Ticket #{ticket.Id} has been assigned to you.",
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.Notifications.Add(assignmentNotification);
        }

        await _context.SaveChangesAsync();

        var response = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.Id == ticket.Id)
            .Select(t => new TicketResponseDto
            {
                Id = t.Id,

                Title = t.Title,

                Description = t.Description,

                UserId = t.UserId,

                UserName = t.User!.FullName,

                AssignedToId = t.AssignedToId,

                AssignedToName =
                    t.AssignedTo != null
                        ? t.AssignedTo.FullName
                        : null,

                CategoryId = t.CategoryId,

                CategoryName = t.Category!.Name,

                PriorityId = t.PriorityId,

                PriorityName = t.Priority!.Name,

                StatusId = t.StatusId,

                StatusName = t.Status!.Name,

                CreatedAt = t.CreatedAt,

                UpdatedAt = t.UpdatedAt,

                ResolvedAt = t.ResolvedAt,

                ClosedAt = t.ClosedAt
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetTicket),
            new { id = ticket.Id },
            response
        );
    }


    // =========================================================
    // PUT: api/tickets/{id}
    // =========================================================
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTicket(
        int id,
        TicketUpdateDto dto)
    {
        var existingTicket = await _context.Tickets
            .FindAsync(id);

        if (existingTicket == null)
        {
            return NotFound(new
            {
                message = "Ticket not found."
            });
        }

        // =====================================================
        // Authorization: who can update this ticket?
        // =====================================================

        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        // Employee can only update their own tickets
        if (User.IsInRole("Employee") &&
            existingTicket.UserId != currentUserId)
        {
            return Forbid();
        }

        // IT Agent can only update tickets assigned to them
        if (User.IsInRole("IT Agent") &&
            existingTicket.AssignedToId != currentUserId)
        {
            return Forbid();
        }

        // Store old values
        var oldStatusId = existingTicket.StatusId;

        var oldAssignedToId =
            existingTicket.AssignedToId;

        // Check if status exists
        var newStatusExists = await _context.Statuses
            .AnyAsync(s => s.Id == dto.StatusId);

        if (!newStatusExists)
        {
            return BadRequest(new
            {
                message = "Invalid status."
            });
        }

        // =====================================================
        // Validate status transition
        // =====================================================

        bool validTransition =
            oldStatusId == dto.StatusId ||

            // Open → In Progress
            (oldStatusId == 1 && dto.StatusId == 2) ||

            // In Progress → Resolved
            (oldStatusId == 2 && dto.StatusId == 3) ||

            // Resolved → Closed
            (oldStatusId == 3 && dto.StatusId == 4) ||

            // Resolved → Reopened
            (oldStatusId == 3 && dto.StatusId == 5) ||

            // Closed → Reopened
            (oldStatusId == 4 && dto.StatusId == 5) ||

            // Reopened → In Progress
            (oldStatusId == 5 && dto.StatusId == 2);

        if (!validTransition)
        {
            return BadRequest(new
            {
                message =
                    "Invalid status transition. " +
                    "Allowed workflow: Open → In Progress → Resolved → Closed. " +
                    "Resolved or Closed tickets can be Reopened, " +
                    "then moved to In Progress."
            });
        }

        // =====================================================
        // Validate assigned IT Agent
        // =====================================================

        if (dto.AssignedToId.HasValue)
        {
            var assignedUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(
                    u => u.Id == dto.AssignedToId.Value);

            if (assignedUser == null)
            {
                return BadRequest(new
                {
                    message = "Assigned user not found."
                });
            }

            if (assignedUser.Role?.Name != "IT Agent")
            {
                return BadRequest(new
                {
                    message =
                        "Ticket can only be assigned to an IT Agent."
                });
            }
        }

        // =====================================================
        // Update ticket data
        // =====================================================

        existingTicket.Title =
            dto.Title;

        existingTicket.Description =
            dto.Description;

        // Employee cannot change ticket ownership or assignment.
        // Admin and IT Agent may update these fields.
        if (!User.IsInRole("Employee"))
        {
            existingTicket.UserId = dto.UserId;
            existingTicket.AssignedToId = dto.AssignedToId;
        }

        existingTicket.CategoryId =
            dto.CategoryId;

        existingTicket.PriorityId =
            dto.PriorityId;

        existingTicket.StatusId =
            dto.StatusId;

        existingTicket.UpdatedAt =
            DateTime.Now;

        // =====================================================
        // Resolved
        // =====================================================

        if (dto.StatusId == 3 &&
            oldStatusId != 3)
        {
            existingTicket.ResolvedAt =
                DateTime.Now;
        }

        // =====================================================
        // Closed
        // =====================================================

        if (dto.StatusId == 4 &&
            oldStatusId != 4)
        {
            existingTicket.ClosedAt =
                DateTime.Now;
        }

        // =====================================================
        // Reopened
        // =====================================================

        if (dto.StatusId == 5 &&
            oldStatusId != 5)
        {
            existingTicket.ClosedAt = null;

            existingTicket.ResolvedAt = null;
        }

        // =====================================================
        // Create history if status changed
        // =====================================================

        if (oldStatusId != dto.StatusId)
        {
            var history = new TicketHistory
            {
                TicketId =
                    existingTicket.Id,

                UserId =
                    currentUserId,

                OldStatusId =
                    oldStatusId,

                NewStatusId =
                    dto.StatusId,

                Action =
                    "Status Changed",

                Notes =
                    "Ticket status changed.",

                CreatedAt =
                    DateTime.Now
            };

            _context.TicketHistories.Add(history);

            // Notify ticket owner
            var statusNotification =
                new Notification
                {
                    UserId =
                        existingTicket.UserId,

                    TicketId =
                        existingTicket.Id,

                    Title =
                        "Ticket Status Updated",

                    Message =
                        $"Ticket #{existingTicket.Id} status has been changed.",

                    IsRead =
                        false,

                    CreatedAt =
                        DateTime.Now
                };

            _context.Notifications.Add(
                statusNotification
            );
        }

        // =====================================================
        // Notify IT Agent when ticket is assigned
        // =====================================================

        if (oldAssignedToId != dto.AssignedToId &&
            dto.AssignedToId.HasValue)
        {
            var assignmentNotification =
                new Notification
                {
                    UserId =
                        dto.AssignedToId.Value,

                    TicketId =
                        existingTicket.Id,

                    Title =
                        "Ticket Assigned",

                    Message =
                        $"Ticket #{existingTicket.Id} has been assigned to you.",

                    IsRead =
                        false,

                    CreatedAt =
                        DateTime.Now
                };

            _context.Notifications.Add(
                assignmentNotification
            );
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }


    // =========================================================
    // DELETE: api/tickets/{id}
    // =========================================================
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var ticket = await _context.Tickets
            .FindAsync(id);

        if (ticket == null)
        {
            return NotFound(new
            {
                message = "Ticket not found."
            });
        }

        // =====================================================
        // Authorization: who can delete this ticket?
        // =====================================================

        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        // Employee can only delete their own tickets
        if (User.IsInRole("Employee") &&
            ticket.UserId != currentUserId)
        {
            return Forbid();
        }

        // IT Agent can only delete tickets assigned to them
        if (User.IsInRole("IT Agent") &&
            ticket.AssignedToId != currentUserId)
        {
            return Forbid();
        }

        _context.Tickets.Remove(ticket);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}