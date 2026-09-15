using ITSupportAPI.Data;
using ITSupportAPI.DTOs.Auth;
using ITSupportAPI.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ITSupportAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IWebHostEnvironment _environment;

    public AuthController(
        ApplicationDbContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
        _environment = environment;
    }


    // =========================================================
    // LOGIN
    // =========================================================

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "User account is inactive."
            });
        }

        var passwordResult =
            _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.Password
            );

        if (passwordResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()
            ),

            new Claim(
                ClaimTypes.Name,
                user.FullName
            ),

            new Claim(
                ClaimTypes.Email,
                user.Email
            ),

            new Claim(
                ClaimTypes.Role,
                user.Role!.Name
            )
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!
            )
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                int.Parse(
                    _configuration["Jwt:DurationInMinutes"]!
                )
            ),
            signingCredentials: credentials
        );

        var tokenString =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        return Ok(new
        {
            message = "Login successful.",
            token = tokenString,
            userId = user.Id,
            fullName = user.FullName,
            email = user.Email,
            role = user.Role!.Name,
            profileImagePath = user.ProfileImagePath
        });
    }


    // =========================================================
    // GET CURRENT USER PROFILE
    // =========================================================

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResponseDto>> Me()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User account not found."
            });
        }

        return Ok(CreateProfileResponse(user));
    }


    // =========================================================
    // UPDATE CURRENT USER PROFILE
    // =========================================================

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<UserProfileResponseDto>> UpdateProfile(
        UpdateProfileDto dto)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User account not found."
            });
        }

        var fullName = dto.FullName.Trim();
        var email = dto.Email.Trim();
        var phone = dto.Phone?.Trim();

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest(new
            {
                message = "Full name is required."
            });
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message = "Email address is required."
            });
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new
            {
                message = "Phone number is required."
            });
        }

        var emailExists = await _context.Users
            .AnyAsync(u =>
                u.Email == email &&
                u.Id != userId.Value
            );

        if (emailExists)
        {
            return Conflict(new
            {
                message = "Email address is already in use."
            });
        }

        user.FullName = fullName;
        user.Email = email;
        user.Phone = phone;

        await _context.SaveChangesAsync();

        return Ok(CreateProfileResponse(user));
    }


    // =========================================================
    // UPLOAD PROFILE PHOTO
    // =========================================================

    [Authorize]
    [HttpPost("profile-photo")]
    public async Task<ActionResult<UserProfileResponseDto>>
        UploadProfilePhoto(IFormFile file)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "Please select an image."
            });
        }

        const long maxFileSize =
            2 * 1024 * 1024;

        if (file.Length > maxFileSize)
        {
            return BadRequest(new
            {
                message = "Image size must not exceed 2 MB."
            });
        }

        var allowedExtensions = new[]
        {
            ".jpg",
            ".jpeg",
            ".png"
        };

        var extension =
            Path.GetExtension(file.FileName)
                .ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                message =
                    "Only JPG, JPEG, and PNG images are allowed."
            });
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User account not found."
            });
        }

        var uploadFolder = Path.Combine(
            _environment.WebRootPath,
            "profile-images"
        );

        Directory.CreateDirectory(uploadFolder);


        // Delete old photo
        if (!string.IsNullOrWhiteSpace(user.ProfileImagePath))
        {
            var oldImagePath = Path.Combine(
                _environment.WebRootPath,
                user.ProfileImagePath
                    .TrimStart('/')
                    .Replace(
                        '/',
                        Path.DirectorySeparatorChar
                    )
            );

            if (System.IO.File.Exists(oldImagePath))
            {
                System.IO.File.Delete(oldImagePath);
            }
        }


        // Create unique file name
        var fileName =
            $"{user.Id}_{Guid.NewGuid():N}{extension}";

        var filePath =
            Path.Combine(
                uploadFolder,
                fileName
            );


        // Save file
        await using (var stream =
            new FileStream(
                filePath,
                FileMode.Create
            ))
        {
            await file.CopyToAsync(stream);
        }


        // Save relative path in database
        user.ProfileImagePath =
            $"/profile-images/{fileName}";

        await _context.SaveChangesAsync();

        return Ok(
            CreateProfileResponse(user)
        );
    }


    // =========================================================
    // DELETE PROFILE PHOTO
    // =========================================================

    [Authorize]
    [HttpDelete("profile-photo")]
    public async Task<ActionResult<UserProfileResponseDto>>
        DeleteProfilePhoto()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User account not found."
            });
        }


        // Delete physical image
        if (!string.IsNullOrWhiteSpace(user.ProfileImagePath))
        {
            var imagePath = Path.Combine(
                _environment.WebRootPath,
                user.ProfileImagePath
                    .TrimStart('/')
                    .Replace(
                        '/',
                        Path.DirectorySeparatorChar
                    )
            );

            if (System.IO.File.Exists(imagePath))
            {
                System.IO.File.Delete(imagePath);
            }
        }


        // Remove path from database
        user.ProfileImagePath = null;

        await _context.SaveChangesAsync();

        return Ok(
            CreateProfileResponse(user)
        );
    }


    // =========================================================
    // IT AGENT TEST ENDPOINT
    // =========================================================

    [Authorize(Roles = "IT Agent")]
    [HttpGet("it-agent")]
    public IActionResult ItAgentOnly()
    {
        return Ok(new
        {
            message = "You are authorized as an IT Agent.",
            role = User.FindFirstValue(
                ClaimTypes.Role
            )
        });
    }


    // =========================================================
    // CURRENT USER ID
    // =========================================================

    private int? GetCurrentUserId()
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        return int.TryParse(
            userIdClaim,
            out var userId
        )
            ? userId
            : null;
    }


    // =========================================================
    // PROFILE RESPONSE
    // =========================================================

    private static UserProfileResponseDto
        CreateProfileResponse(User user)
    {
        return new UserProfileResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role!.Name,
            CreatedAt = user.CreatedAt,
            ProfileImagePath =
                user.ProfileImagePath
        };
    }
}