# Business Understanding
- **What problem the application solves**: The application manages registrations, ID card generation, attendance tracking (over 5 days), and gifts/payments (Sambavanai, travel charge) for an event (likely religious/vedic, given terms like "Parayanakar", "Veda/Sakha").
  *(Inferred from `Registration.java`, `AttendanceAndGifts.java`, `RegistrationFormComponent`)*
- **Main user types**:
  1. Participants/Parayanakars (registering for the event)
  2. Administrators (managing attendance and dashboards)
  *(Inferred from `User.java`, `AdminUser.java`, `RegistrationFormComponent`, and `app-routing.module.ts`)*
- **Business workflows**:
  - Participants fill out a registration form (personal, bank, scholar details) and receive a PDF ID card with a QR code.
  - Admins log in to a dashboard, scan participant QR codes to mark attendance across 5 days (Forenoon/Afternoon), and track gifts and travel charges.
  - Data can be exported to CSV or Excel.
  *(Inferred from `registration-form.component.ts`, `attendance-management.module.ts`, `QRCodeService.java`, `ExportCsvService.java`)*
- **Key use cases**:
  - Participant registration with Aadhaar validation.
  - ID card PDF generation with QR code.
  - Admin dashboard for statistics.
  - QR Code scanning for attendance.
  - Manual entry for attendance.
  - Exporting attendance and registration reports.
  *(Inferred from frontend routing `app-routing.module.ts` and backend controllers)*

# Architecture
- **Frontend technology stack**: Angular 16 (`@angular/core ~16.0.0`), Angular Material, RxJS, Chart.js, jsPDF, html2canvas, ngx-scanner. *(Inferred from `package.json`)*
- **Backend technology stack**: Java 17, Spring Boot 3.1.0, Spring Data JPA, Spring Security, Lombok, Apache POI (Excel), OpenCSV, ZXing (QR codes). *(Inferred from `pom.xml`)*
- **Database technology stack**: PostgreSQL. *(Inferred from `application.properties` and `pom.xml`)*
- **Authentication mechanism**: HTTP Basic Authentication (with BCrypt password encoding) is currently active in the security filter chain, though JWT dependencies and services (`JwtService.java`) exist in the codebase. *(Inferred from `SecurityConfig.java` and `pom.xml`)*
- **Authorization model**: Unable to determine from codebase. (While `AdminUser` exists, there are no explicit `@PreAuthorize` or role-based matchers configured in the `SecurityConfig`).
- **API architecture**: RESTful APIs using Spring `@RestController`. *(Inferred from `RegistrationController.java`, `AuthController.java`)*
- **Deployment-related configurations**: Backend uses `application.properties` for port/DB configs. Frontend uses `proxy.conf.json` for proxying API requests and `angular.json` for build configurations. Bash scripts (`src_fe.sh`, `src_be.sh`, `fe_deployment.sh`) suggest custom deployment processes. *(Inferred from codebase root files)*

# Functional Modules
- **Registration Module**:
  - *Purpose*: Handles participant sign-ups.
  - *Key functionality*: Form validation, Aadhaar duplication check, PDF ID card generation.
  - *Dependencies*: jsPDF, html2canvas.
  - *Entry points*: `/registration` route, `RegistrationController`.
- **Admin & Attendance Module**:
  - *Purpose*: Manages event tracking.
  - *Key functionality*: QR scanning, marking Day 1-5 attendance, recording gifts.
  - *Dependencies*: `@zxing/ngx-scanner`, `AttendanceAndGiftsRepository`.
  - *Entry points*: `/admin/dashboard`, `/admin/qr-scanner` routes.
- **Reporting Module**:
  - *Purpose*: Data export.
  - *Key functionality*: Generates CSV and Excel files of participants.
  - *Dependencies*: Apache POI, OpenCSV.
  - *Entry points*: Export services in backend.

# Frontend Analysis
- **Routing structure**: Managed via `AppRoutingModule` (`app-routing.module.ts`). It defines core routes (`/login`, `/registration`) and uses lazy loading (`loadChildren`) for feature modules like `/admin/attendance` and `/manual-entry`.
- **Shared components**: Uses a `SharedModule` containing components like `AlertDialogComponent`. *(Inferred from `app.module.ts`)*
- **Feature modules**: `AttendanceManagementModule`, `ManualEntryModule`. *(Inferred from `app-routing.module.ts`)*
- **State management approach**: Local component state and RxJS `BehaviorSubject` in services/components (e.g., `devices$` in `DashboardComponent`, `currentUserSubject` in `AuthService`). No global store like NgRx is used. *(Inferred from `auth.service.ts` and `dashboard.component.ts`)*
- **Form handling strategy**: Angular Reactive Forms (`FormBuilder`, `FormGroup`, `Validators`). Custom validators are implemented for matching account numbers and checking future dates. *(Inferred from `registration-form.component.ts`)*
- **UI libraries**: Angular Material (Forms, Select, Datepicker, Dialog), FontAwesome, Toastr, Chart.js. *(Inferred from `package.json` and `app.module.ts`)*

# Backend Analysis
- **Controllers**: Located in `com.eventregistration.controller` (e.g., `RegistrationController`, `AuthController`, `HallController`).
- **Services**: Located in `com.eventregistration.service` (e.g., `RegistrationService`, `AuthService`, `QRCodeService`, `ExportCsvService`).
- **Repositories**: Located in `com.eventregistration.repository`, extending Spring Data interfaces (e.g., `RegistrationRepository`, `AttendanceAndGiftsRepository`).
- **DTOs**: Present in `com.eventregistration.dto`. *(Inferred from `dto` package)*
- **Entity models**: `Registration` (participant details), `AttendanceAndGifts` (tracking), `User`, `AdminUser`. *(Inferred from `model` package)*
- **Security configuration**: Configured via `SecurityConfig.java` using `SecurityFilterChain`. It configures CORS and permits public access to registration endpoints while requiring authentication for others. It currently utilizes `.httpBasic()`.
- **Exception handling patterns**: Global exception handling is used via `GlobalExceptionHandler.java`. *(Inferred from `exception` package files)*

# Database Analysis
- **Tables**: `registrations`, `attendance_and_gifts`, `users`, `admin_users` (based on JPA entities). *(Inferred from `Registration.java`, `AttendanceAndGifts.java`, etc.)*
- **Relationships**: A one-to-one relationship (`@OneToOne`) exists between `Registration` and `AttendanceAndGifts`. *(Inferred from `Registration.java` and `AttendanceAndGifts.java`)*
- **Constraints**: 
  - `registrations`: Unique constraint on `aadhaar_number`. Not-null constraints on multiple fields (e.g., `phone_number`, `dob`).
  - `attendance_and_gifts`: Unique constraint on `qr_code_identifier`.
  *(Inferred from Entity definitions)*
- **Audit fields**: `@CreationTimestamp` (`created_at`) and `@UpdateTimestamp` (`updated_at`) are present in `AttendanceAndGifts.java`.
- **Migration strategy**: Hibernate auto-DDL is used (`spring.jpa.hibernate.ddl-auto=update`). No dedicated migration tool like Flyway or Liquibase is observed. *(Inferred from `application.properties`)*

# Coding Standards
- **Naming conventions**: Standard Java conventions (camelCase variables/methods, PascalCase classes). Angular standard file naming (`component-name.component.ts`).
- **Architectural patterns**: Classic layered monolithic architecture in Spring Boot (Controller -> Service -> Repository). Feature-based modular architecture in Angular.
- **Reusable components**: Present in `SharedModule` in frontend.
- **Common coding practices**: Heavy use of Lombok for getters/setters in backend. Extensive use of Angular Material components. Inline HTML string literals used for PDF generation via html2canvas instead of templates. *(Inferred from `RegistrationFormComponent`)*

# Technical Debt
- **Duplicated code**: Multiple export services (`ExportExcelService.java` and `ExcelExportService.java`) suggest duplication.
- **Large classes**: `RegistrationFormComponent` is notably large (~740 lines), mixing form logic, validation, and PDF generation.
- **Potential refactoring opportunities**: 
  - Move PDF generation logic out of the component into a dedicated service.
  - Consolidate export services in the backend.
  - Move static configuration data (like the hardcoded list of banks and Vedas/Sakhas in `registration-form.component.ts`) to backend APIs or separate configuration files.
- **Architectural concerns**: 
  - Using `ddl-auto=update` in production environments is risky; a migration tool should be introduced.
  - Security config has remnants of commented-out code and JWT dependencies while falling back to Basic Auth.
