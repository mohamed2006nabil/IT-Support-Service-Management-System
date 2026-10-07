using Microsoft.AspNetCore.Identity;

var hasher = new PasswordHasher<object>();

Console.Write("Enter password: ");
var password = Console.ReadLine();

if (string.IsNullOrWhiteSpace(password))
{
    Console.WriteLine("Password cannot be empty.");
    return;
}

var hash = hasher.HashPassword(null!, password);

Console.WriteLine();
Console.WriteLine("Generated Password Hash:");
Console.WriteLine(hash);