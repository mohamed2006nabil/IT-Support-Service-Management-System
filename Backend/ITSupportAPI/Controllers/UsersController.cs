using ITSupportAPI.Data;
using ITSupportAPI.DTOs.Users;
using ITSupportAPI.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    private readonly PasswordHasher<User>
        _passwordHasher;

    public UsersController(
        ApplicationDbContext context)
    {
        _context = context;

        _passwordHasher =
            new PasswordHasher<User>();
    }


    // =========================================================
    // GET: api/users
    // =========================================================

    [HttpGet]
    public async Task<
        ActionResult<IEnumerable<UserResponseDto>>
    > GetUsers()
    {
        var users = await _context.Users

            .Include(u => u.Department)

            .Include(u => u.Role)

            .AsNoTracking()

            .Select(u => new UserResponseDto
            {
                Id = u.Id,

                FullName =
                    u.FullName,

                Email =
                    u.Email,

                Phone =
                    u.Phone,

                ProfileImagePath =
                    u.ProfileImagePath,

                DepartmentId =
                    u.DepartmentId,

                DepartmentName =
                    u.Department != null
                        ? u.Department.Name
                        : null,

                RoleId =
                    u.RoleId,

                RoleName =
                    u.Role != null
                        ? u.Role.Name
                        : string.Empty,

                IsActive =
                    u.IsActive,

                CreatedAt =
                    u.CreatedAt
            })

            .ToListAsync();


        return Ok(users);
    }


    // =========================================================
    // GET: api/users/{id}
    // =========================================================

    [HttpGet("{id}")]
    public async Task<
        ActionResult<UserResponseDto>
    > GetUser(int id)
    {
        var user = await _context.Users

            .Include(u => u.Department)

            .Include(u => u.Role)

            .AsNoTracking()

            .Where(u => u.Id == id)

            .Select(u => new UserResponseDto
            {
                Id = u.Id,

                FullName =
                    u.FullName,

                Email =
                    u.Email,

                Phone =
                    u.Phone,

                ProfileImagePath =
                    u.ProfileImagePath,

                DepartmentId =
                    u.DepartmentId,

                DepartmentName =
                    u.Department != null
                        ? u.Department.Name
                        : null,

                RoleId =
                    u.RoleId,

                RoleName =
                    u.Role != null
                        ? u.Role.Name
                        : string.Empty,

                IsActive =
                    u.IsActive,

                CreatedAt =
                    u.CreatedAt
            })

            .FirstOrDefaultAsync();


        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "User not found."
            });
        }


        return Ok(user);
    }


    // =========================================================
    // POST: api/users
    // =========================================================

    [HttpPost]
    public async Task<
        ActionResult<UserResponseDto>
    > CreateUser(
        UserCreateDto dto)
    {
        var user = new User
        {
            FullName =
                dto.FullName,

            Email =
                dto.Email,

            Phone =
                dto.Phone,

            DepartmentId =
                dto.DepartmentId,

            RoleId =
                dto.RoleId,

            IsActive =
                true,

            CreatedAt =
                DateTime.Now
        };


        user.PasswordHash =
            _passwordHasher.HashPassword(
                user,
                dto.PasswordHash
            );


        _context.Users.Add(user);

        await _context.SaveChangesAsync();


        var createdUser =
            await _context.Users

                .Include(u =>
                    u.Department)

                .Include(u =>
                    u.Role)

                .AsNoTracking()

                .Where(u =>
                    u.Id == user.Id)

                .Select(u =>
                    new UserResponseDto
                    {
                        Id =
                            u.Id,

                        FullName =
                            u.FullName,

                        Email =
                            u.Email,

                        Phone =
                            u.Phone,

                        ProfileImagePath =
                            u.ProfileImagePath,

                        DepartmentId =
                            u.DepartmentId,

                        DepartmentName =
                            u.Department != null
                                ? u.Department.Name
                                : null,

                        RoleId =
                            u.RoleId,

                        RoleName =
                            u.Role != null
                                ? u.Role.Name
                                : string.Empty,

                        IsActive =
                            u.IsActive,

                        CreatedAt =
                            u.CreatedAt
                    })

                .FirstAsync();


        return CreatedAtAction(
            nameof(GetUser),

            new
            {
                id = user.Id
            },

            createdUser
        );
    }


    // =========================================================
    // PUT: api/users/{id}
    // =========================================================

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(
        int id,
        UserUpdateDto dto)
    {
        var existingUser =
            await _context.Users.FindAsync(id);


        if (existingUser == null)
        {
            return NotFound(new
            {
                message =
                    "User not found."
            });
        }


        existingUser.FullName =
            dto.FullName;

        existingUser.Email =
            dto.Email;

        existingUser.Phone =
            dto.Phone;

        existingUser.DepartmentId =
            dto.DepartmentId;

        existingUser.RoleId =
            dto.RoleId;

        existingUser.IsActive =
            dto.IsActive;


        if (
            !string.IsNullOrWhiteSpace(
                dto.PasswordHash
            )
        )
        {
            existingUser.PasswordHash =
                _passwordHasher.HashPassword(
                    existingUser,
                    dto.PasswordHash
                );
        }


        await _context.SaveChangesAsync();


        return NoContent();
    }


    // =========================================================
    // DELETE: api/users/{id}
    // =========================================================

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(
        int id)
    {
        var user =
            await _context.Users.FindAsync(id);


        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "User not found."
            });
        }


        _context.Users.Remove(user);

        await _context.SaveChangesAsync();


        return NoContent();
    }
}