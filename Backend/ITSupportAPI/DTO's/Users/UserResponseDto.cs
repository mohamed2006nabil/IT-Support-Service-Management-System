namespace ITSupportAPI.DTOs.Users;

public class UserResponseDto
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string? ProfileImagePath { get; set; }

    public int? DepartmentId { get; set; }

    public string? DepartmentName { get; set; }

    public int RoleId { get; set; }

    public string RoleName { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}