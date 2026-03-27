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
A modern full-stack application leveraging Firebase for authentication, real-time data persistence, and cloud storage. The frontend captures images and interacts with Gemini for OCR, while Firebase handles secure user sessions and centralized data management.

**Tech Stack:**

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + PWA | Fast development server, modern component-based UI, installable as a standalone app. |
| **Styling** | Tailwind CSS | Utility-first styling for rapid, responsive UI development. |
| **Authentication** | Firebase Auth (Google) | Secure, managed authentication with seamless Google Sign-In integration. |
| **Database** | Firebase Firestore | Real-time, NoSQL cloud database with offline persistence and robust security rules. |
| **Storage** | Firebase Storage | Scalable cloud storage for receipt images with secure access control. |
| **AI / OCR** | `@google/genai` | Powerful multimodal LLM for accurate receipt data extraction. |

**Core Architectural Decisions:**

1.  **Client-Side AI Processing**: The Gemini API is called directly from the client side to process the image before uploading, providing immediate feedback and reducing server-side complexity.
2.  **Serverless Data Management**: Replaced local SQLite and file-system storage with Firebase Firestore and Storage. This ensures data is centralized, synchronized across devices, and protected by server-side security rules.
3.  **Centralized Persona Management**: Personas are now stored in Firestore, associated with the user's unique ID. This allows users to access their business profiles from any device after logging in.
4.  **Secure Authentication**: Implemented Google Authentication to ensure that only authorized users can access the application and their specific data vault.
5.  **Client-Side Image Compression**: Images are compressed in the browser using a web worker before being uploaded to Firebase Storage, optimizing bandwidth and storage usage.

## 🗺️ Roadmap

**Project Overview:**
ETR Receipts started as a local-only prototype and has evolved into a full-stack application with AI OCR, dynamic multi-persona support, WhatsApp forwarding, and persistent file storage.

**Current Status (Phase 1, 2 & 3):**
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

## 📝 Changelog

### [2026-03-27] - Firebase Migration and Google Authentication

#### 🚀 Major Changes
*   **Google Authentication**: Integrated Firebase Authentication with Google Sign-In. Users now have secure, private accounts, ensuring their data is protected and accessible only to them.
*   **Firestore Migration**: Migrated all data storage (Receipts and Personas) from local SQLite/localStorage to Firebase Firestore. This enables real-time synchronization across devices and centralized data management.
*   **Cloud Image Storage**: Replaced local file-system image storage with Firebase Storage. Receipt images are now securely stored in the cloud and associated with the user's account.
*   **Security Rules**: Implemented robust Firestore Security Rules to enforce data ownership and prevent unauthorized access.
*   **Real-time Personas**: The persona management system now uses real-time listeners (`onSnapshot`), ensuring that any changes to business profiles are instantly reflected across the application.
*   **Enhanced Export**: Updated the PDF export functionality to fetch receipt images directly from Firebase Storage, ensuring audit-ready reports are generated correctly with cloud-hosted assets.

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
