# ETR Receipts Documentation

## 🎯 Project Purpose
ETR Receipts is a full-stack web application designed to streamline expense tracking and receipt management by allowing users to scan physical receipts, automatically extract key information (merchant, date, amount) using AI-powered OCR, and associate them with specific business personas or tax entities. It solves the problem of manual data entry and lost paper receipts by digitizing, categorizing, and securely storing expense records in a centralized system.

## 💡 Value Proposition
*   **AI-Powered Extraction**: Eliminates manual data entry by leveraging Google's Gemini AI to instantly parse receipt images for critical metadata.
*   **Flexible Input & PWA**: Installable as a Progressive Web App (PWA) for a native-like experience, allowing users to capture receipts via device camera or upload existing images from their gallery.
*   **Multi-Persona Management**: Seamlessly handles multiple business entities or clients, associating expenses with specific tax PINs (e.g., KRA PIN) and contact details. Users can create, edit, and delete their own personas.
*   **Automated Workflows**: Generates pre-filled WhatsApp messages with receipt details and a direct link to the scanned receipt, streamlining the reimbursement or accounting pipeline.

## 👥 Stakeholder Relevance
*   **Who this is built for**: Freelancers, small business owners, and accounting professionals managing multiple client profiles.
*   **How they would use it day-to-day**: They install the app on their mobile device or desktop (via PWA), create or select a specific business persona, snap a photo or upload an existing receipt from their gallery, review the AI-extracted data (skipping non-critical missing fields if necessary), and save it. They can then easily forward the receipt via WhatsApp.
*   **The outcome or value it drives for them**: Saves hours of manual bookkeeping, reduces human error in expense reporting, and ensures tax compliance by accurately tracking expenses against specific entity PINs.
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
| **Storage** | File System (CSV + Multer) | Simple, portable local storage for metadata and images without needing a complex database setup. |

**Core Architectural Decisions:**

1.  **Client-Side AI Processing**: The Gemini API is called directly from the client side to process the image before uploading, reducing server load and providing immediate feedback to the user.
2.  **Flat-File Data Storage**: To keep the application portable and easy to deploy in constrained environments, receipt metadata is stored in a simple CSV file (`data/receipts.csv`) and images are saved directly to the file system using Multer, rather than requiring a dedicated database service.
3.  **Local Storage for Personas**: Persona configurations (names, PINs, phone numbers) are stored in the browser's `localStorage`, allowing for quick, client-side state management without complicating the backend schema.

## 🗺️ Roadmap

**Project Overview:**
ETR Receipts started as a local-only prototype and has evolved into a full-stack application with AI OCR, dynamic multi-persona support, WhatsApp forwarding, and persistent file storage.

**Current Status (Phase 1):**
*   [x] Basic UI and navigation
*   [x] Camera and gallery integration for receipt scanning
*   [x] Gemini AI integration for OCR data extraction
*   [x] Full-stack Express backend for data persistence
*   [x] CSV and image file storage
*   [x] Dynamic multi-persona management (Create, Edit, Delete) with KRA PINs and phone numbers
*   [x] WhatsApp forwarding integration with direct receipt links
*   [x] Progressive Web App (PWA) configuration
*   [x] Soft validation (warning modals) allowing users to skip missing fields
*   [x] Support footer integration

**Upcoming Phases:**

*   **Phase 2: Enhanced Data Management**
    *   [ ] Migrate from CSV to a robust database (e.g., SQLite or PostgreSQL)
    *   [ ] Add receipt editing and updating capabilities on the backend
*   **Phase 3: Analytics & Export**
    *   [ ] Generate PDF/Excel expense reports per persona
    *   [ ] Add monthly spending charts and category breakdowns
    *   [ ] Implement user authentication and cloud sync

## 📝 Changelog

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
