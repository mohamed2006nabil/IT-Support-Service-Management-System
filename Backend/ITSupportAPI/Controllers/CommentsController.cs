using ITSupportAPI.Data;
using ITSupportAPI.DTOs.Comments;
using ITSupportAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CommentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/comments
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CommentResponseDto>>> GetComments()
    {
        var query = _context.Comments
            .Include(c => c.User)
            .AsNoTracking()
            .AsQueryable();

        // Employee can only see comments on their own tickets
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

            query = query.Where(c =>
                _context.Tickets.Any(t =>
                    t.Id == c.TicketId &&
                    t.UserId == userId));
        }

        // IT Agent can only see comments on tickets assigned to them
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

            query = query.Where(c =>
                _context.Tickets.Any(t =>
                    t.Id == c.TicketId &&
                    t.AssignedToId == userId));
        }

        var comments = await query
            .Select(c => new CommentResponseDto
            {
                Id = c.Id,
                TicketId = c.TicketId,
                UserId = c.UserId,
                CommentText = c.CommentText,
                CreatedAt = c.CreatedAt,
                UserName = c.User.FullName
            })
            .ToListAsync();

        return Ok(comments);
    }

    // GET: api/comments/1
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet("{id}")]
    public async Task<ActionResult<CommentResponseDto>> GetComment(int id)
    {
        var query = _context.Comments
            .Include(c => c.User)
            .AsNoTracking()
            .Where(c => c.Id == id);

        // Employee can only access comments on their own tickets
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

            query = query.Where(c =>
                _context.Tickets.Any(t =>
                    t.Id == c.TicketId &&
                    t.UserId == userId));
        }

        // IT Agent can only access comments on tickets assigned to them
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

            query = query.Where(c =>
                _context.Tickets.Any(t =>
                    t.Id == c.TicketId &&
                    t.AssignedToId == userId));
        }

        var comment = await query
            .Select(c => new CommentResponseDto
            {
                Id = c.Id,
                TicketId = c.TicketId,
                UserId = c.UserId,
                CommentText = c.CommentText,
                CreatedAt = c.CreatedAt,
                UserName = c.User.FullName
            })
            .FirstOrDefaultAsync();

        if (comment == null)
        {
            return NotFound(new
            {
                message = "Comment not found."
            });
        }

        return Ok(comment);
    }

    // POST: api/comments
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpPost]
    public async Task<ActionResult<CommentResponseDto>> CreateComment(
        CommentCreateDto dto)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == dto.TicketId);

        if (ticket == null)
        {
            return BadRequest(new
            {
                message = "Ticket not found."
            });
        }

        // Employee can only comment on their own tickets
        if (User.IsInRole("Employee") &&
            ticket.UserId != currentUserId)
        {
            return Forbid();
        }

        // IT Agent can only comment on tickets assigned to them
        if (User.IsInRole("IT Agent") &&
            ticket.AssignedToId != currentUserId)
        {
            return Forbid();
        }

        var comment = new Comment
        {
            TicketId = dto.TicketId,
            UserId = currentUserId,
            CommentText = dto.CommentText,
            CreatedAt = DateTime.Now
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var response = await _context.Comments
            .Include(c => c.User)
            .AsNoTracking()
            .Where(c => c.Id == comment.Id)
            .Select(c => new CommentResponseDto
            {
                Id = c.Id,
                TicketId = c.TicketId,
                UserId = c.UserId,
                CommentText = c.CommentText,
                CreatedAt = c.CreatedAt,
                UserName = c.User.FullName
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetComment),
            new { id = comment.Id },
            response
        );
    }

    // DELETE: api/comments/1
    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null)
        {
            return NotFound(new
            {
                message = "Comment not found."
            });
        }

        // Employee can only delete their own comments
        // on their own tickets.
        if (User.IsInRole("Employee"))
        {
            var canAccessTicket = await _context.Tickets
                .AnyAsync(t =>
                    t.Id == comment.TicketId &&
                    t.UserId == currentUserId);

            if (!canAccessTicket || comment.UserId != currentUserId)
            {
                return Forbid();
            }
        }

        // IT Agent can only delete their own comments
        // on tickets assigned to them.
        if (User.IsInRole("IT Agent"))
        {
            var canAccessTicket = await _context.Tickets
                .AnyAsync(t =>
                    t.Id == comment.TicketId &&
                    t.AssignedToId == currentUserId);

            if (!canAccessTicket || comment.UserId != currentUserId)
            {
                return Forbid();
            }
        }

        // Admin can delete any comment.
        _context.Comments.Remove(comment);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
