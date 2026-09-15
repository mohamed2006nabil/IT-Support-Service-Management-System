namespace ITSupportAPI.DTOs.Users;

public class UserUpdateDto
{
    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? Phone { get; set; }

    public int? DepartmentId { get; set; }

    public int RoleId { get; set; }

    public bool IsActive { get; set; }
}