using ITSupportAPI.Data;
using ITSupportAPI.DTOs.Attachments;
using ITSupportAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttachmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    // Maximum allowed upload size: 10 MB
    private const long MaxFileSize = 10 * 1024 * 1024;

    // Keep the allowlist intentionally small and limited to common support-file types.
    private static readonly Dictionary<string, string> AllowedFileTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".txt"] = "text/plain",
            [".doc"] = "application/msword",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".xls"] = "application/vnd.ms-excel",
            [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

    public AttachmentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AttachmentResponseDto>>> GetAttachments()
    {
        var query = _context.Attachments
            .AsNoTracking()
            .AsQueryable();

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

            query = query.Where(a =>
                _context.Tickets.Any(t =>
                    t.Id == a.TicketId &&
                    t.UserId == userId));
        }

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

            query = query.Where(a =>
                _context.Tickets.Any(t =>
                    t.Id == a.TicketId &&
                    t.AssignedToId == userId));
        }

        var attachments = await query
            .Select(a => new AttachmentResponseDto
            {
                Id = a.Id,
                TicketId = a.TicketId,
                UploadedById = a.UploadedById,
                FileName = a.FileName,
                FileType = a.FileType,
                FileSize = a.FileSize,
                UploadedAt = a.UploadedAt
            })
            .ToListAsync();

        return Ok(attachments);
    }

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet("{id}")]
    public async Task<ActionResult<AttachmentResponseDto>> GetAttachment(int id)
    {
        var query = _context.Attachments
            .AsNoTracking()
            .Where(a => a.Id == id);

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

            query = query.Where(a =>
                _context.Tickets.Any(t =>
                    t.Id == a.TicketId &&
                    t.UserId == userId));
        }

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

            query = query.Where(a =>
                _context.Tickets.Any(t =>
                    t.Id == a.TicketId &&
                    t.AssignedToId == userId));
        }

        var attachment = await query
            .Select(a => new AttachmentResponseDto
            {
                Id = a.Id,
                TicketId = a.TicketId,
                UploadedById = a.UploadedById,
                FileName = a.FileName,
                FileType = a.FileType,
                FileSize = a.FileSize,
                UploadedAt = a.UploadedAt
            })
            .FirstOrDefaultAsync();

        if (attachment == null)
            return NotFound(new { message = "Attachment not found." });

        return Ok(attachment);
    }

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<ActionResult<AttachmentResponseDto>> UploadAttachment(
        [FromForm] IFormFile file,
        [FromForm] int ticketId,
        [FromForm] int uploadedById)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Please select a file." });

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new
            {
                message = "File size cannot exceed 10 MB."
            });
        }

        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
            return BadRequest(new { message = "Ticket not found." });

        if (User.IsInRole("Employee") &&
            ticket.UserId != currentUserId)
        {
            return Forbid();
        }

        if (User.IsInRole("IT Agent") &&
            ticket.AssignedToId != currentUserId)
        {
            return Forbid();
        }

        // uploadedById is intentionally ignored for authorization.
        // The authenticated user is always recorded as the uploader.
        var extension = Path.GetExtension(file.FileName);

        if (string.IsNullOrWhiteSpace(extension) ||
            !AllowedFileTypes.TryGetValue(extension, out var expectedContentType))
        {
            return BadRequest(new
            {
                message = "File type is not allowed."
            });
        }

        // Do not trust the browser-provided Content-Type.
        // It must match the server-side extension allowlist.
        if (!string.Equals(
                file.ContentType,
                expectedContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Invalid file content type."
            });
        }

        var safeOriginalFileName = Path.GetFileName(file.FileName);

        if (string.IsNullOrWhiteSpace(safeOriginalFileName))
        {
            return BadRequest(new
            {
                message = "Invalid file name."
            });
        }

        var uploadsFolder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Uploads");

        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        try
        {
            await using (var stream = new FileStream(
                filePath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new Attachment
            {
                TicketId = ticketId,
                UploadedById = currentUserId,
                FileName = safeOriginalFileName,
                FilePath = filePath,
                FileType = expectedContentType,
                FileSize = file.Length,
                UploadedAt = DateTime.Now
            };

            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();

            var response = new AttachmentResponseDto
            {
                Id = attachment.Id,
                TicketId = attachment.TicketId,
                UploadedById = attachment.UploadedById,
                FileName = attachment.FileName,
                FileType = attachment.FileType,
                FileSize = attachment.FileSize,
                UploadedAt = attachment.UploadedAt
            };

            return CreatedAtAction(
                nameof(GetAttachment),
                new { id = attachment.Id },
                response);
        }
        catch
        {
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            throw;
        }
    }

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet("download/{id}")]
    public async Task<IActionResult> DownloadAttachment(int id)
    {
        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var attachment = await _context.Attachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attachment == null)
            return NotFound(new { message = "Attachment not found." });

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == attachment.TicketId);

        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        if (User.IsInRole("Employee") &&
            ticket.UserId != currentUserId)
        {
            return Forbid();
        }

        if (User.IsInRole("IT Agent") &&
            ticket.AssignedToId != currentUserId)
        {
            return Forbid();
        }

        if (!System.IO.File.Exists(attachment.FilePath))
            return NotFound(new { message = "File not found on server." });

        var fileStream = new FileStream(
            attachment.FilePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read);

        return File(
            fileStream,
            attachment.FileType ?? "application/octet-stream",
            attachment.FileName,
            enableRangeProcessing: true);
    }

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAttachment(int id)
    {
        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var attachment = await _context.Attachments
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attachment == null)
            return NotFound(new { message = "Attachment not found." });

        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == attachment.TicketId);

        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        if (User.IsInRole("Employee"))
        {
            if (ticket.UserId != currentUserId ||
                attachment.UploadedById != currentUserId)
            {
                return Forbid();
            }
        }

        if (User.IsInRole("IT Agent"))
        {
            if (ticket.AssignedToId != currentUserId ||
                attachment.UploadedById != currentUserId)
            {
                return Forbid();
            }
        }

        if (System.IO.File.Exists(attachment.FilePath))
            System.IO.File.Delete(attachment.FilePath);

        _context.Attachments.Remove(attachment);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
