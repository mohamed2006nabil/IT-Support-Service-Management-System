using ITSupportAPI.Data;
using ITSupportAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StatusesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/statuses
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Status>>> GetStatuses()
    {
        return await _context.Statuses
            .AsNoTracking()
            .ToListAsync();
    }
}