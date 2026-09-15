using ITSupportAPI.Data;
using ITSupportAPI.DTOs.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }


    // ========================================
    // GET: api/notifications
    // ========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationResponseDto>>> GetNotifications()
    {
        var query = _context.Notifications
            .AsNoTracking()
            .AsQueryable();


        // Employee and IT Agent can only see their own notifications

        if (
            User.IsInRole("Employee") ||
            User.IsInRole("IT Agent")
        )
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
                n => n.UserId == userId
            );
        }


        var notifications = await query
            .Select(n => new NotificationResponseDto
            {
                Id = n.Id,

                UserId = n.UserId,

                TicketId = n.TicketId,

                Title = n.Title,

                Message = n.Message,

                IsRead = n.IsRead,

                CreatedAt = n.CreatedAt
            })
            .ToListAsync();


        return Ok(notifications);
    }


    // ========================================
    // GET: api/notifications/1
    // ========================================

    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationResponseDto>> GetNotification(int id)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(
                n => n.Id == id
            );


        // Employee and IT Agent can only access
        // their own notification

        if (
            User.IsInRole("Employee") ||
            User.IsInRole("IT Agent")
        )
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
                n => n.UserId == userId
            );
        }


        var notification = await query
            .Select(n => new NotificationResponseDto
            {
                Id = n.Id,

                UserId = n.UserId,

                TicketId = n.TicketId,

                Title = n.Title,

                Message = n.Message,

                IsRead = n.IsRead,

                CreatedAt = n.CreatedAt
            })
            .FirstOrDefaultAsync();


        if (notification == null)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }


        return Ok(notification);
    }


    // ========================================
    // PUT: api/notifications/1/read
    // ========================================

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(
                n => n.Id == id
            );


        if (notification == null)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }


        // Employee can only mark their own notification as read

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


            if (notification.UserId != userId)
            {
                return Forbid();
            }
        }


        notification.IsRead = true;


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message = "Notification marked as read."
        });
    }


    // ========================================
    // PUT: api/notifications/read-all
    // ========================================

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var query = _context.Notifications
            .Where(
                n => !n.IsRead
            );


        // Employee can only mark their own notifications as read

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


            query = query.Where(
                n => n.UserId == userId
            );
        }


        var notifications =
            await query.ToListAsync();


        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }


        await _context.SaveChangesAsync();


        return Ok(new
        {
            message = "All notifications marked as read."
        });
    }
}