using ITSupportAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ITSupportAPI.Models;
using System.Data;
using System.Text;

var bootstrapAdmin = args.Contains("--bootstrap-admin", StringComparer.Ordinal);
var builder = WebApplication.CreateBuilder(
    args.Where(argument => argument != "--bootstrap-admin").ToArray());

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!
                )
            ),

            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ValidateLifetime = true,

            ClockSkew = TimeSpan.Zero
        };
    });

// Authorization
builder.Services.AddAuthorization();

// Swagger
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "IT Support API",
        Version = "v1",
        Description = "IT Support and Service Management System API"
    });

    // JWT Bearer Authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token."
    });

    // Apply JWT authentication to Swagger endpoints
    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

var app = builder.Build();

if (bootstrapAdmin)
{
    await BootstrapAdminAsync(app);
    return;
}

// Automatically open Swagger in the browser in Development.
if (app.Environment.IsDevelopment())
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var addresses = app.Services
            .GetRequiredService<IServer>()
            .Features
            .Get<IServerAddressesFeature>()?
            .Addresses;

        var swaggerUri = addresses?
            .Select(address =>
            {
                if (!Uri.TryCreate(address, UriKind.Absolute, out var baseUri) ||
                    baseUri.Scheme != Uri.UriSchemeHttp)
                {
                    return null;
                }

                return new Uri(baseUri, "/swagger");
            })
            .FirstOrDefault(uri => uri is not null);

        if (swaggerUri is null)
        {
            Console.Error.WriteLine(
                "Could not open Swagger automatically: no HTTP server address is available.");
            return;
        }

        try
        {
            System.Diagnostics.Process.Start(
                new System.Diagnostics.ProcessStartInfo
                {
                    FileName = swaggerUri.ToString(),
                    UseShellExecute = true
                });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Could not open Swagger automatically: {ex.Message}");
        }
    });
}

// Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "IT Support API v1"
        );

        options.RoutePrefix = "swagger";
    });
}


// Middleware
app.UseHttpsRedirection();

app.UseCors("AllowAngular");

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static async Task BootstrapAdminAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    if (await db.Users.AnyAsync())
    {
        throw new InvalidOperationException(
            "Admin bootstrap refused: the database already contains a user.");
    }

    Console.Write("Admin full name: ");
    var fullName = Console.ReadLine()?.Trim();

    Console.Write("Admin email: ");
    var email = Console.ReadLine()?.Trim();

    Console.Write("Admin password (input is hidden): ");
    var password = ReadHiddenPassword();

    if (string.IsNullOrWhiteSpace(fullName) ||
        string.IsNullOrWhiteSpace(email) ||
        string.IsNullOrWhiteSpace(password))
    {
        throw new InvalidOperationException(
            "Admin bootstrap requires a full name, email, and non-empty password.");
    }

    await using var transaction = await db.Database.BeginTransactionAsync(
        IsolationLevel.Serializable);

    if (await db.Users.AnyAsync())
    {
        throw new InvalidOperationException(
            "Admin bootstrap refused: the database already contains a user.");
    }

    var adminRole = await db.Roles
        .SingleOrDefaultAsync(role => role.Name == "Admin");

    if (adminRole is null)
    {
        throw new InvalidOperationException(
            "Admin bootstrap failed: the database does not contain the Admin role. Run the database setup script first.");
    }

    var user = new User
    {
        FullName = fullName,
        Email = email,
        RoleId = adminRole.Id,
        IsActive = true,
        CreatedAt = DateTime.Now
    };

    user.PasswordHash = new PasswordHasher<User>()
        .HashPassword(user, password);

    db.Users.Add(user);
    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    Console.WriteLine($"Admin account created for {user.Email}.");
}

static string ReadHiddenPassword()
{
    var password = new StringBuilder();

    while (true)
    {
        var key = Console.ReadKey(intercept: true);

        if (key.Key == ConsoleKey.Enter)
        {
            Console.WriteLine();
            return password.ToString();
        }

        if (key.Key == ConsoleKey.Backspace)
        {
            if (password.Length > 0)
            {
                password.Length--;
            }

            continue;
        }

        if (!char.IsControl(key.KeyChar))
        {
            password.Append(key.KeyChar);
        }
    }
}