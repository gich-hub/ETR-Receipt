# ETR Receipts Documentation

## 🎯 Project Purpose
ETR Receipts is a full-stack web application designed to streamline expense tracking and receipt management by allowing users to scan physical receipts, automatically extract key information (merchant, date, amount, and KRA-specific CU Invoice Numbers) using AI-powered OCR, and associate them with specific business personas or tax entities. It solves the problem of manual data entry and lost paper receipts by digitizing, categorizing, and securely storing expense records in a centralized system optimized for Kenyan tax compliance.

## 💡 Value Proposition
*   **AI-Powered Extraction**: Eliminates manual data entry by leveraging Google's Gemini AI to instantly parse receipt images for critical metadata.
*   **Flexible Input & PWA**: Installable as a Progressive Web App (PWA) for a native-like experience, allowing users to capture receipts via device camera or upload existing images from their gallery.
*   **Multi-Persona Management**: Seamlessly handles multiple business entities or clients, associating expenses with specific tax PINs (e.g., KRA PIN) and contact details. Users can create, edit, and delete their own personas.
*   **Automated Validation**: Automatically cross-references the extracted buyer PIN against the selected persona's PIN to prevent misattribution of expenses.
*   **Automated Workflows**: Generates pre-filled WhatsApp messages with receipt details and a direct link to the scanned receipt, streamlining the reimbursement or accounting pipeline.

## 👥 Stakeholder Relevance
*   **Who this is built for**: Freelancers, small business owners, and accounting professionals managing multiple client profiles.
*   **How they would use it day-to-day**: They install the app on their mobile device or desktop (via PWA), create or select a specific business persona, snap a photo or upload an existing receipt from their gallery. The app automatically validates that the receipt belongs to the selected persona. They can then review the AI-extracted data (enlarging the receipt image if needed to check fine print), skip non-critical missing fields if necessary, and save it. Finally, they can easily forward the receipt via WhatsApp.
*   **The outcome or value it drives for them**: Saves hours of manual bookkeeping, reduces human error in expense reporting, and ensures tax compliance by accurately tracking expenses against specific entity PINs with automated validation safeguards.
*   **Secondary stakeholders**: Tax authorities (benefiting from accurate, digitized records) and corporate finance teams (receiving automated receipt submissions).

## 🏗️ Architecture

**High-Level Overview:**
A strictly modular and decoupled full-stack application. The architecture follows a Clean Architecture approach, separating the core domain logic from infrastructure details (Firebase, Gemini, WhatsApp). This ensures high maintainability, testability, and the ability to swap out service providers with minimal code changes.

**Tech Stack:**

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + PWA | Fast development server, modern component-based UI, installable as a standalone app. |
| **Styling** | Tailwind CSS | Utility-first styling for rapid, responsive UI development. |
| **Authentication** | Firebase Auth (Google) | Secure, managed authentication with seamless Google Sign-In integration. |
| **Database** | Firebase Firestore | Real-time, NoSQL cloud database with offline persistence and robust security rules. |
| **Storage** | Firebase Storage | Scalable cloud storage for receipt images with secure access control. |
| **AI / OCR** | Gemini 3 (via `@google/genai`) | Powerful multimodal LLM for accurate receipt data extraction. |
| **Notifications** | WhatsApp (Provider Pattern) | Modular notification layer for automated receipt handoff. |

**Core Architectural Decisions:**

1.  **Modular Service Layer**: Implemented a central service layer (`ReceiptService`, `PersonaService`, `OCRService`) that orchestrates business logic. The UI components interact only with these services, never directly with the database or AI APIs.
2.  **Provider Pattern (Dependency Inversion)**: Infrastructure components (Firestore, Gemini, WhatsApp) are implemented as "Providers" that adhere to abstract interfaces (`IDatabaseProvider`, `IOCRProvider`, `INotificationProvider`). This allows swapping a provider (e.g., switching from Firestore to a different database) by editing only one file.
3.  **Domain-Driven Entities**: Defined core data models (`Receipt`, `Persona`, `OCRResult`) in a central domain layer, ensuring consistent data structures across the entire application.
4.  **Decoupled UI**: React components are purely presentational or handle local UI state, delegating all data persistence and processing to the service layer.
5.  **Robust Error Handling & Logging**: Implemented a modular `AppLogger` and standardized error handling across all services and providers to ensure system stability and easier debugging.

## 🗺️ Roadmap

**Project Overview:**
ETR Receipts has evolved from a local-only prototype into a production-ready, modular full-stack application with a decoupled architecture, AI OCR, and secure cloud persistence.

**Current Status (Phase 1, 2, 3 & 4):**
*   [x] Basic UI and navigation
*   [x] Camera and gallery integration for receipt scanning
*   [x] Gemini AI integration for OCR data extraction (upgraded to Gemini 3)
*   [x] Firebase integration for data persistence and authentication
*   [x] Firestore database and Firebase Storage for images
*   [x] Client-side image compression for faster uploads
*   [x] Dynamic multi-persona management (Create, Edit, Delete) with KRA PINs and phone numbers
*   [x] WhatsApp forwarding integration with direct receipt links
*   [x] Progressive Web App (PWA) configuration
*   [x] Soft validation (warning modals) allowing users to skip missing fields
*   [x] Support footer integration
*   [x] Automated Buyer PIN validation against selected Persona
*   [x] Interactive receipt image enlargement on the review screen
*   [x] Receipt editing and updating capabilities
*   [x] PDF and CSV expense report generation
*   [x] User authentication (Google) and cloud sync
*   [x] **Modular Backend Refactoring**: Strictly decoupled architecture with Service/Provider patterns.

## 📝 Changelog

### [2026-03-27] - Modular Architecture Refactoring

#### 🚀 Major Changes
*   **Decoupled Architecture**: Refactored the entire application logic into a modular structure (Domain, Infrastructure, Services). This separates "what" the app does from "how" it does it (e.g., separating receipt logic from Firestore implementation).
*   **Provider Pattern**: Implemented interchangeable providers for Database, OCR, and Notifications. This allows for future-proofing the tech stack by making it easy to swap out underlying technologies.
*   **Centralized Service Layer**: Created dedicated services (`ReceiptService`, `PersonaService`, `OCRService`) to handle all business logic, significantly simplifying React components and improving code reusability.
*   **Domain Entities**: Established a clear set of TypeScript interfaces for core entities, ensuring type safety and data consistency throughout the codebase.
*   **Standardized Logging**: Integrated a modular `AppLogger` for consistent error reporting and debugging across all layers of the application.
*   **UI Cleanup**: Refactored all major pages (`Home`, `Review`, `Scan`, `Export`) to consume the new service layer, resulting in cleaner, more maintainable frontend code.

### [2026-03-25] - Image Transfer Reliability and Field Refinement

#### 🚀 Major Changes
*   **Robust Image Transfer**: Implemented Base64 encoding for receipt images during the scanning-to-review transition. This ensures images are reliably displayed even if the original file object is lost in the browser's navigation state.
*   **Field Prioritization**: Removed the generic "Invoice/Receipt Number" field across the entire stack (AI prompt, database, UI, and exports). The "Control Unit Invoice Number" (CU Invoice Number) is now the primary identifier, aligning with KRA ETR requirements.
*   **Backend API Expansion**: Added a dedicated GET endpoint for individual receipts to improve performance and reliability when editing specific records.
*   **Type Safety Improvements**: Refactored the Review form to handle numeric inputs as strings, preventing UI crashes and improving the editing experience for partial or non-numeric data.

### [2026-03-24] - Performance and Storage Optimizations

#### 🚀 Major Changes
*   **Database Migration**: Replaced the flat-file CSV storage with a robust SQLite database (`better-sqlite3`). This eliminates file-blocking issues, allows for concurrent read/writes, and significantly improves backend performance.
*   **AI Model Upgrade**: Upgraded the OCR engine from `gemini-2.5-flash` to `gemini-3-flash-preview` for faster and more accurate data extraction.
*   **Client-Side Image Compression**: Integrated `browser-image-compression` to automatically shrink receipt images (up to 1MB) before uploading or AI processing, saving bandwidth and storage space. Non-image files (like PDFs) safely bypass this step.
*   **Dashboard Optimization**: Fixed a data leak on the home dashboard where receipt counts and empty states were incorrectly calculating across all personas instead of the currently selected one.

### [2026-03-23] - Validation and UX Enhancements

#### 🚀 Major Changes
*   **Buyer PIN Validation**: The scanning process now automatically cross-references the extracted buyer PIN against the currently selected persona's KRA PIN. If there is a contradiction, the app flags an error and halts processing, preventing misattribution of expenses.
*   **Receipt Enlargement**: Added the ability to click on the scanned receipt image preview on the Review screen to view it in a full-screen, darkened overlay for easier verification of fine print.

### [2026-03-22] - Dynamic Personas and WhatsApp Integration

#### 🚀 Major Changes
*   **App Renamed**: Officially renamed the application to "ETR Receipts".
*   **Dynamic Personas**: Removed hardcoded demo personas. Users can now create, edit, and delete their own personas directly from the sidebar. Persona data is persisted in `localStorage`.
*   **WhatsApp Forwarding**: Replaced the automatic WhatsApp redirect with a "Receipt Saved!" success screen featuring a "Forward via WhatsApp" button. This generates a pre-filled message containing receipt details and a direct link to the receipt.
*   **Support Footer**: Added an elegant, professional support footer to the home screen with a WhatsApp contact link.

### [2026-03-22] - PWA, Gallery Uploads, and UX Improvements

#### 🚀 Major Changes
*   Configured the application as a Progressive Web App (PWA) using `vite-plugin-pwa`, enabling installation on mobile and desktop devices.
*   Added gallery upload support alongside the camera capture for flexible receipt input.
*   Introduced a soft validation workflow: users are now warned about missing fields via a custom modal but can choose to "Skip & Save" anyway.
*   Replaced native browser `confirm()` dialogs with custom, mobile-friendly modals for deletion actions.

### [v1.0.0] - Initial Release

#### 🚀 Major Changes
*   Implemented full-stack Express server with Vite middleware.
*   Added Multer for receipt image uploads and CSV-based metadata storage.
*   Integrated `@google/genai` for automated receipt OCR.
*   Added Persona management sidebar with KRA PIN and Phone Number configurations.
*   Implemented simulated auto-send feature upon receipt save.

#### 🐛 Fixes
*   Fixed image preview to load from the backend URL instead of local blobs.
*   Resolved routing issues by ensuring the persona state is passed through the scanning flow.

---
Keep this document factual and grounded in what we've actually built. 
Avoid speculation. Flag anything uncertain with [UNCONFIRMED].
When updating, always revise Stakeholder Relevance if the use case or 
target user has shifted — this section should reflect current intent, not original assumptions.
