namespace ITSupportAPI.DTOs.Auth;

public class UpdateProfileDto
{
    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }
}