# ReceiptVault Documentation

## 🎯 Project Purpose
ReceiptVault is a full-stack web application designed to streamline expense tracking and receipt management by allowing users to scan physical receipts, automatically extract key information (merchant, date, amount) using AI-powered OCR, and associate them with specific business personas or tax entities. It solves the problem of manual data entry and lost paper receipts by digitizing, categorizing, and securely storing expense records in a centralized system.

## 💡 Value Proposition
*   **AI-Powered Extraction**: Eliminates manual data entry by leveraging Google's Gemini AI to instantly parse receipt images for critical metadata.
*   **Multi-Persona Management**: Seamlessly handles multiple business entities or clients, associating expenses with specific tax PINs (e.g., KRA PIN) and contact details.
*   **Automated Workflows**: Simulates automated routing by "sending" processed receipts to configured phone numbers, streamlining the reimbursement or accounting pipeline.

## 👥 Stakeholder Relevance
*   **Who this is built for**: Freelancers, small business owners, and accounting professionals managing multiple client profiles.
*   **How they would use it day-to-day**: They select a specific business persona, snap a photo of a receipt, review the AI-extracted data, and save it.
*   **The outcome or value it drives for them**: Saves hours of manual bookkeeping, reduces human error in expense reporting, and ensures tax compliance by accurately tracking expenses against specific entity PINs.
*   **Secondary stakeholders**: Tax authorities (benefiting from accurate, digitized records) and corporate finance teams (receiving automated receipt submissions).

## 🏗️ Architecture

**High-Level Overview:**
A monolithic full-stack application serving a React SPA via Vite middleware on an Express server. The frontend captures images and interacts with Gemini for OCR, while the backend handles file uploads and CSV-based data persistence.

**Tech Stack:**

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast development server, modern component-based UI. |
| **Styling** | Tailwind CSS | Utility-first styling for rapid, responsive UI development. |
| **Backend** | Node.js + Express | Lightweight server to handle API requests and serve static assets. |
| **AI / OCR** | `@google/genai` | Powerful multimodal LLM for accurate receipt data extraction. |
| **Storage** | File System (CSV + Multer) | Simple, portable local storage for metadata and images without needing a complex database setup. |

**Core Architectural Decisions:**

1.  **Client-Side AI Processing**: The Gemini API is called directly from the client side to process the image before uploading, reducing server load and providing immediate feedback to the user.
2.  **Flat-File Data Storage**: To keep the application portable and easy to deploy in constrained environments, receipt metadata is stored in a simple CSV file (`data/receipts.csv`) and images are saved directly to the file system using Multer, rather than requiring a dedicated database service.
3.  **Local Storage for Personas**: Persona configurations (names, PINs, phone numbers) are stored in the browser's `localStorage`, allowing for quick, client-side state management without complicating the backend schema.

**Directory Structure:**
*   `/src`: Frontend React application (components, pages, lib).
*   `/server.ts`: Express backend entry point and API routes.
*   `/data`: Server-side storage for uploaded images and the `receipts.csv` database.

## 🗺️ Roadmap

**Project Overview:**
ReceiptVault started as a local-only prototype and has evolved into a full-stack application with AI OCR, multi-persona support, and persistent file storage.

**Current Status (Phase 1):**
*   [x] Basic UI and navigation
*   [x] Camera integration for receipt scanning
*   [x] Gemini AI integration for OCR data extraction
*   [x] Full-stack Express backend for data persistence
*   [x] CSV and image file storage
*   [x] Multi-persona management with KRA PINs and phone numbers
*   [x] Auto-send simulation workflow

**Upcoming Phases:**

*   **Phase 2: Enhanced Data Management**
    *   [ ] Migrate from CSV to a robust database (e.g., SQLite or PostgreSQL)
    *   [ ] Implement real SMS/WhatsApp integration for the auto-send feature
    *   [ ] Add receipt editing and updating capabilities on the backend
*   **Phase 3: Analytics & Export**
    *   [ ] Generate PDF/Excel expense reports per persona
    *   [ ] Add monthly spending charts and category breakdowns
    *   [ ] Implement user authentication and cloud sync

## 📝 Changelog

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
