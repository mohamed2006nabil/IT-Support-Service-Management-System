using ITSupportAPI.Data;
using ITSupportAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrioritiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PrioritiesController(ApplicationDbContext context)
    {
        _context = context;
    }


    // =====================================================
    // GET: api/priorities
    // Employee, IT Agent, Admin
    // =====================================================

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Priority>>> GetPriorities()
    {
        var priorities = await _context.Priorities
            .AsNoTracking()
            .ToListAsync();

        return Ok(priorities);
    }


    // =====================================================
    // GET: api/priorities/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<ActionResult<Priority>> GetPriority(int id)
    {
        var priority = await _context.Priorities
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (priority == null)
        {
            return NotFound(new
            {
                message = "Priority not found."
            });
        }

        return Ok(priority);
    }


    // =====================================================
    // POST: api/priorities
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Priority>> CreatePriority(
        Priority priority)
    {
        // Validate name
        if (string.IsNullOrWhiteSpace(priority.Name))
        {
            return BadRequest(new
            {
                message = "Priority name is required."
            });
        }

        if (priority.Name.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "Priority name must be at least 2 characters."
            });
        }


        // Check duplicate name
        var duplicateExists =
            await _context.Priorities.AnyAsync(
                p =>
                    p.Name.ToLower() ==
                    priority.Name.Trim().ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(new
            {
                message = "Priority name already exists."
            });
        }


        priority.Name =
            priority.Name.Trim();

        if (priority.Description != null)
        {
            priority.Description =
                priority.Description.Trim();
        }


        _context.Priorities.Add(priority);

        await _context.SaveChangesAsync();


        return CreatedAtAction(
            nameof(GetPriority),
            new { id = priority.Id },
            priority
        );
    }


    // =====================================================
    // PUT: api/priorities/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePriority(
        int id,
        Priority updatedPriority)
    {
        var existingPriority =
            await _context.Priorities
                .FirstOrDefaultAsync(
                    p => p.Id == id
                );

        if (existingPriority == null)
        {
            return NotFound(new
            {
                message = "Priority not found."
            });
        }


        // Validate name
        if (string.IsNullOrWhiteSpace(
                updatedPriority.Name))
        {
            return BadRequest(new
            {
                message = "Priority name is required."
            });
        }

        if (updatedPriority.Name.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "Priority name must be at least 2 characters."
            });
        }


        // Check duplicate name
        var duplicateExists =
            await _context.Priorities.AnyAsync(
                p =>
                    p.Id != id &&
                    p.Name.ToLower() ==
                    updatedPriority.Name.Trim().ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(new
            {
                message = "Priority name already exists."
            });
        }


        existingPriority.Name =
            updatedPriority.Name.Trim();

        existingPriority.Description =
            string.IsNullOrWhiteSpace(
                updatedPriority.Description)
                ? null
                : updatedPriority.Description.Trim();


        await _context.SaveChangesAsync();

        return NoContent();
    }


    // =====================================================
    // DELETE: api/priorities/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePriority(int id)
    {
        var priority =
            await _context.Priorities
                .Include(p => p.Tickets)
                .FirstOrDefaultAsync(
                    p => p.Id == id
                );

        if (priority == null)
        {
            return NotFound(new
            {
                message = "Priority not found."
            });
        }


        // Prevent deleting a priority
        // that is already used by tickets
        if (priority.Tickets.Any())
        {
            return BadRequest(new
            {
                message =
                    "This priority cannot be deleted because it is already used by one or more tickets."
            });
        }


        _context.Priorities.Remove(priority);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}