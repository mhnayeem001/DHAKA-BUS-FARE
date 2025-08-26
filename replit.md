# Overview

This is a One-Page Fare Web App for Dhaka bus routes with an Admin Panel. The application allows users to search for bus fares between different stops in Dhaka and provides an administrative interface for uploading Excel files containing route data. The system automatically converts Excel data to JSON format and serves it to the frontend for real-time fare lookups.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a traditional multi-page architecture with separate HTML files for user and admin interfaces:
- **Main Application (index.html)**: Single-page user interface with autocomplete search functionality, language toggle (English/Bangla), and theme switching (light/dark mode)
- **Admin Panel (admin.html)**: Separate administrative interface for file uploads and data management
- **Static Asset Management**: CSS and JavaScript files organized in dedicated directories under `/public`
- **Client-side Data Storage**: Uses localStorage for user preferences (language, theme) and browser sessions for admin authentication

### Backend Architecture
The system employs a simple Express.js server architecture:
- **File-based Data Storage**: JSON files stored in `/data` directory serve as the primary data source
- **Upload Processing Pipeline**: Multer handles file uploads, XLSX library processes Excel files, and the system automatically converts data to JSON format
- **Authentication Middleware**: Basic username/password authentication protects admin routes
- **Static File Serving**: Express serves frontend assets from the `/public` directory

### Data Management
The application uses a file-based approach for data persistence:
- **Primary Data Format**: JSON structure with routes containing from/to locations, distances, and fares
- **Data Updates**: Excel uploads completely replace existing JSON data
- **Directory Structure**: Separate folders for data storage (`/data`) and temporary uploads (`/uploads`)

### Security Model
Simple authentication system designed for single administrator use:
- **Admin Credentials**: Environment variables or hardcoded fallbacks for username/password
- **Session Management**: Browser sessionStorage for maintaining login state
- **File Upload Restrictions**: Only Excel file formats accepted through MIME type validation

## External Dependencies

### Core Runtime Dependencies
- **Node.js with Express**: Web server framework for handling HTTP requests and static file serving
- **Multer**: Middleware for handling multipart/form-data file uploads
- **XLSX**: Library for parsing Excel files and converting to JSON format
- **bcrypt**: Password hashing library for secure credential storage

### Frontend Dependencies
- **Bootstrap 5.3.0**: CSS framework for responsive design and UI components
- **Font Awesome 6.4.0**: Icon library for user interface elements
- **Native Web APIs**: Geolocation API for nearest stop functionality, localStorage for client-side data persistence

### Development Dependencies
- **File System**: Native Node.js fs module for directory creation and file operations
- **Path Utilities**: Node.js path module for file path handling

The application is designed to be self-contained with minimal external service dependencies, focusing on local file processing and serving static content.