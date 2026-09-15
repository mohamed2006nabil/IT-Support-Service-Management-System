using ITSupportAPI.Data;
using ITSupportAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DepartmentsController(ApplicationDbContext context)
    {
        _context = context;
    }


    // =====================================================
    // GET: api/departments
    // Employee, IT Agent, Admin
    // =====================================================

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
    {
        var departments = await _context.Departments
            .AsNoTracking()
            .ToListAsync();

        return Ok(departments);
    }


    // =====================================================
    // GET: api/departments/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<ActionResult<Department>> GetDepartment(int id)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        return Ok(department);
    }


    // =====================================================
    // POST: api/departments
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Department>> CreateDepartment(
        Department department)
    {
        if (string.IsNullOrWhiteSpace(department.Name))
        {
            return BadRequest(new
            {
                message = "Department name is required."
            });
        }

        if (department.Name.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "Department name must be at least 2 characters."
            });
        }


        var duplicateExists =
            await _context.Departments.AnyAsync(
                d =>
                    d.Name.ToLower() ==
                    department.Name.Trim().ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(new
            {
                message = "Department name already exists."
            });
        }


        department.Name =
            department.Name.Trim();


        _context.Departments.Add(department);

        await _context.SaveChangesAsync();


        return CreatedAtAction(
            nameof(GetDepartment),
            new { id = department.Id },
            department
        );
    }


    // =====================================================
    // PUT: api/departments/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(
        int id,
        Department updatedDepartment)
    {
        var existingDepartment =
            await _context.Departments
                .FirstOrDefaultAsync(
                    d => d.Id == id
                );

        if (existingDepartment == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }


        if (string.IsNullOrWhiteSpace(
                updatedDepartment.Name))
        {
            return BadRequest(new
            {
                message = "Department name is required."
            });
        }

        if (updatedDepartment.Name.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "Department name must be at least 2 characters."
            });
        }


        var duplicateExists =
            await _context.Departments.AnyAsync(
                d =>
                    d.Id != id &&
                    d.Name.ToLower() ==
                    updatedDepartment.Name.Trim().ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(new
            {
                message = "Department name already exists."
            });
        }


        existingDepartment.Name =
            updatedDepartment.Name.Trim();


        await _context.SaveChangesAsync();

        return NoContent();
    }


    // =====================================================
    // DELETE: api/departments/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        var department =
            await _context.Departments
                .Include(d => d.Users)
                .FirstOrDefaultAsync(
                    d => d.Id == id
                );

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }


        // Prevent deleting a department
        // that is already assigned to users
        if (department.Users.Any())
        {
            return BadRequest(new
            {
                message =
                    "This department cannot be deleted because it is already assigned to one or more users."
            });
        }


        _context.Departments.Remove(department);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}