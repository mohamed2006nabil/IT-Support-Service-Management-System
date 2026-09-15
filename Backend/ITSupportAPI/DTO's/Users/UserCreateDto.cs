namespace ITSupportAPI.DTOs.Users;

public class UserCreateDto
{
    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? Phone { get; set; }

    public int? DepartmentId { get; set; }

    public int RoleId { get; set; }

    public bool IsActive { get; set; }
}