using ITSupportAPI.Data;
using ITSupportAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // =====================================================
    // GET: api/categories
    // Accessible by Employee, IT Agent, Admin
    // =====================================================

    [Authorize(Roles = "Employee,IT Agent,Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .ToListAsync();

        return Ok(categories);
    }


    // =====================================================
    // GET: api/categories/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetCategory(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return Ok(category);
    }


    // =====================================================
    // POST: api/categories
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory(
        Category category)
    {
        // Validate name
        if (string.IsNullOrWhiteSpace(category.Name))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        if (category.Name.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "Category name must be at least 2 characters."
            });
        }

        // Check duplicate name
        var duplicateExists =
            await _context.Categories.AnyAsync(
                c => c.Name.ToLower() ==
                     category.Name.Trim().ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(new
            {
                message = "Category name already exists."
            });
        }

        category.Name =
            category.Name.Trim();

        if (category.Description != null)
        {
            category.Description =
                category.Description.Trim();
        }

        _context.Categories.Add(category);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCategory),
            new { id = category.Id },
            category
        );
    }


    // =====================================================
    // PUT: api/categories/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(
        int id,
        Category updatedCategory)
    {
        var existingCategory =
            await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id);

        if (existingCategory == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        // Validate name
        if (string.IsNullOrWhiteSpace(
                updatedCategory.Name))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        if (updatedCategory.Name.Trim().Length < 2)
        {
            return BadRequest(new
            {
                message =
                    "Category name must be at least 2 characters."
            });
        }

        // Check duplicate name
        var duplicateExists =
            await _context.Categories.AnyAsync(
                c =>
                    c.Id != id &&
                    c.Name.ToLower() ==
                    updatedCategory.Name.Trim().ToLower()
            );

        if (duplicateExists)
        {
            return BadRequest(new
            {
                message = "Category name already exists."
            });
        }

        existingCategory.Name =
            updatedCategory.Name.Trim();

        existingCategory.Description =
            string.IsNullOrWhiteSpace(
                updatedCategory.Description)
                ? null
                : updatedCategory.Description.Trim();

        await _context.SaveChangesAsync();

        return NoContent();
    }


    // =====================================================
    // DELETE: api/categories/1
    // Admin only
    // =====================================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category =
            await _context.Categories
                .Include(c => c.Tickets)
                .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        // Prevent deleting a category that is
        // already used by tickets
        if (category.Tickets.Any())
        {
            return BadRequest(new
            {
                message =
                    "This category cannot be deleted because it is already used by one or more tickets."
            });
        }

        _context.Categories.Remove(category);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}