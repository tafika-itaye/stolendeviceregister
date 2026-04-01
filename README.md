# DeviceWatch — Stolen Device Registry

A national stolen device registry for Malawi. Check IMEI/serial numbers against reported stolen devices. Free to check, free to register.

## What's Real (Production Code)

- **IMEI validation** — Luhn algorithm, real checksum verification
- **User authentication** — signup, login, session management, password hashing (localStorage, moves to server-side bcrypt in production)
- **Device registry** — CRUD operations, status management (stolen/recovered), duplicate detection
- **Search** — real-time lookup against the registry by IMEI or serial number
- **Dashboard** — user's registered devices, status changes, deletion
- **Form validation** — client-side with proper error handling
- **Police report format validation** — MW/XX/YYYY/NNNNN pattern enforcement
- **Responsive design** — mobile-first, works on all devices

## What's Simulated (Needs Backend)

- **National ID verification** — format-checked only; production calls NRB API
- **Police report verification** — format-checked only; production calls MPS API
- **Photo upload** — form field present but storage needs server-side object storage
- **Email/SMS notifications** — not implemented; production uses transactional email/SMS
- **MACRA IMEI blacklisting** — not connected; production integrates via API

## File Structure

```
stolendeviceregister/
├── index.html          # Landing page with public IMEI search
├── about.html          # About + FAQ
├── feasibility.html    # Technical & commercial feasibility study
├── dashboard.html      # Authenticated user dashboard
├── css/
│   └── style.css       # Shared production stylesheet
├── js/
│   └── app.js          # Core app module (DW namespace)
├── pages/
│   ├── signup.html     # User registration
│   ├── login.html      # User login
│   └── register.html   # Report stolen device form
└── README.md
```

## Tech Stack (Current → Production)

| Current | Production |
|---------|-----------|
| localStorage | PostgreSQL 16 |
| Client-side JS hash | bcrypt (server) |
| Static HTML | ASP.NET Core 8 MVC |
| GitHub Pages | Cloud VPS + CDN |
| — | .NET MAUI mobile app |

## Developed By

**TechNexus Malawi** — technexus_mw@proton.me — www.technexusmw.com
