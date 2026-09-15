namespace ITSupportAPI.DTOs.Auth;

public class UserProfileResponseDto
{
    public int UserId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string Role { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string? ProfileImagePath { get; set; }
}