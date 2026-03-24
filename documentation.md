# ETR Receipts Documentation

## 🎯 Project Purpose
ETR Receipts is a full-stack web application designed to streamline expense tracking and receipt management by allowing users to scan physical receipts, automatically extract key information (merchant, date, amount) using AI-powered OCR, and associate them with specific business personas or tax entities. It solves the problem of manual data entry and lost paper receipts by digitizing, categorizing, and securely storing expense records in a centralized system.

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
A monolithic full-stack application serving a React SPA via Vite middleware on an Express server. The frontend captures images and interacts with Gemini for OCR, while the backend handles file uploads and CSV-based data persistence.

**Tech Stack:**

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + PWA | Fast development server, modern component-based UI, installable as a standalone app. |
| **Styling** | Tailwind CSS | Utility-first styling for rapid, responsive UI development. |
| **Backend** | Node.js + Express | Lightweight server to handle API requests and serve static assets. |
| **AI / OCR** | `@google/genai` | Powerful multimodal LLM for accurate receipt data extraction. |
| **Storage** | SQLite + File System (Multer) | Robust, concurrent local storage for metadata (`better-sqlite3`) and images without needing a complex database server setup. |

**Core Architectural Decisions:**

1.  **Client-Side AI Processing**: The Gemini API is called directly from the client side to process the image before uploading, reducing server load and providing immediate feedback to the user.
2.  **SQLite Data Storage**: To keep the application portable while supporting concurrent users, receipt metadata is stored in a local SQLite database (`data/receipts.db`) using `better-sqlite3`. Images are saved directly to the file system using Multer.
3.  **Local Storage for Personas**: Persona configurations (names, PINs, phone numbers) are stored in the browser's `localStorage`, allowing for quick, client-side state management without complicating the backend schema.
4.  **Client-Side Image Compression**: Images are compressed in the browser using a web worker before being uploaded or sent to the AI model, significantly reducing bandwidth and storage requirements.

## 🗺️ Roadmap

**Project Overview:**
ETR Receipts started as a local-only prototype and has evolved into a full-stack application with AI OCR, dynamic multi-persona support, WhatsApp forwarding, and persistent file storage.

**Current Status (Phase 1):**
*   [x] Basic UI and navigation
*   [x] Camera and gallery integration for receipt scanning
*   [x] Gemini AI integration for OCR data extraction (upgraded to Gemini 3)
*   [x] Full-stack Express backend for data persistence
*   [x] SQLite database and image file storage
*   [x] Client-side image compression for faster uploads
*   [x] Dynamic multi-persona management (Create, Edit, Delete) with KRA PINs and phone numbers
*   [x] WhatsApp forwarding integration with direct receipt links
*   [x] Progressive Web App (PWA) configuration
*   [x] Soft validation (warning modals) allowing users to skip missing fields
*   [x] Support footer integration
*   [x] Automated Buyer PIN validation against selected Persona
*   [x] Interactive receipt image enlargement on the review screen

**Upcoming Phases:**

*   **Phase 2: Enhanced Data Management**
    *   [ ] Add receipt editing and updating capabilities on the backend
*   **Phase 3: Analytics & Export**
    *   [ ] Generate PDF/Excel expense reports per persona
    *   [ ] Add monthly spending charts and category breakdowns
    *   [ ] Implement user authentication and cloud sync

## 📝 Changelog

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
