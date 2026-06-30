# Basma HR Management System

<p align="center">
  <img src="./docs/logo.png" alt="Basma Logo" width="150"/>
</p>

<p align="center">
A modern multi-tenant HR Management System built with <b>Node.js</b>, <b>Express.js</b>, and <b>PostgreSQL</b>.
</p>

---

# Table of Contents

- Overview
- Features
- Tech Stack
- System Roles
- Project Architecture
- Folder Structure
- Installation
- PostgreSQL Setup
- Environment Variables
- Running the Project
- Authentication Flow
- API Documentation
- Postman Testing
- Database Schema
- Security
- Deployment

---

# Overview

Basma HR Management System is a multi-tenant platform that allows companies to manage their HR teams and employees securely.

Each company has its own:

- Employees
- HR members
- Departments
- Branches
- Documents

Every company is completely isolated from other companies.

---

# Features

## Authentication

- Manager registration using Email OTP verification
- Secure JWT Authentication
- Refresh Tokens
- Password Hashing (bcrypt)
- Google OAuth
- Facebook OAuth

---

## Company Management

Manager can:

- Create a company
- Add departments
- Invite multiple HR members
- Manage company branches
- Edit company information

---

## HR Management

Manager can:

- Invite HR members
- Assign branch to each HR
- View HR list
- Remove HR
- Resend invitations

---

## Employee Management

Manager and HR can:

- Add employees
- Upload documents
- Update employee information
- Search employees
- Filter employees
- Activate/Deactivate employees

---

## Profile Management

Every user can:

- Update profile
- Change password
- Upload profile picture

---

## File Uploads

Supports uploading:

- Images
- PDFs
- Employee Documents

---

# Tech Stack

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL

## Authentication

- JWT
- Refresh Tokens
- Passport.js
- Google OAuth
- Facebook OAuth
- bcrypt

## Email

- Nodemailer
- Gmail SMTP

## File Upload

- Multer

## Validation

- Express Validator

## Logging

- Morgan
- Winston (optional)

---

# System Roles

## Manager

Can:

- Register company
- Verify email using OTP
- Create company departments
- Invite HR members
- Manage company
- Manage employees
- View reports

---

## HR

Can:

- Accept invitation
- Complete account setup
- Login
- Manage employees
- Upload employee documents

---

## Employee

Can:

- Accept invitation
- Create password
- Login
- View own profile

---

# Project Architecture

```
Internet
    │
    ▼
Express API
    │
    ├──────── Authentication
    │
    ├──────── Companies
    │
    ├──────── HR
    │
    ├──────── Employees
    │
    ├──────── Profiles
    │
    ├──────── Uploads
    │
    ▼
PostgreSQL Database
```

---

# Folder Structure

```
src/

├── app.js
│
├── config/
│   ├── database.js
│   ├── migrate.js
│   └── passport.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── upload.middleware.js
│   ├── validation.middleware.js
│   └── error.middleware.js
│
├── apis/
│
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js
│   │   ├── auth.service.js
│   │   ├── auth.validation.js
│   │   └── auth.module.js
│   │
│   ├── company/
│   │   ├── company.controller.js
│   │   ├── company.routes.js
│   │   ├── company.service.js
│   │   └── company.module.js
│   │
│   ├── hr/
│   │   ├── hr.controller.js
│   │   ├── hr.routes.js
│   │   ├── hr.service.js
│   │   └── hr.module.js
│   │
│   ├── employee/
│   │   ├── employee.controller.js
│   │   ├── employee.routes.js
│   │   ├── employee.service.js
│   │   └── employee.module.js
│   │
│   └── profile/
│       ├── profile.controller.js
│       ├── profile.routes.js
│       ├── profile.service.js
│       └── profile.module.js
│
├── services/
│   ├── email.service.js
│   ├── jwt.service.js
│   └── upload.service.js
│
├── utils/
│   ├── logger.js
│   ├── response.js
│   └── helpers.js
│
├── uploads/
│
└── server.js
```

---

# Application Flow

## Manager Registration

```
Manager Sign Up

↓

Enter Personal Information

↓

Verify Email using OTP

↓

Automatically Logged In

↓

Company Setup

↓

Create Departments

↓

Invite HR Members
(Multiple HRs Supported)

↓

Send Invitations

↓

Dashboard
```

---

## HR Invitation Flow

```
Manager sends invitation

↓

HR receives email

↓

Clicks invitation link

↓

Accept Invitation

↓

Enter

• Name

• Phone Number

• Password

↓

Account Created

↓

Redirect to Login

↓

Dashboard
```

---

## Employee Invitation Flow

```
Manager / HR creates employee

↓

Employee receives email

↓

Accept Invitation

↓

Create Password

↓

Login

↓

Dashboard
```

---
# Installation

## Prerequisites

Before running the project, make sure the following software is installed:

| Software | Version |
|----------|----------|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 15+ |
| Git | Latest |

Verify the installation:

```bash
node -v
npm -v
psql --version
git --version
```

---

# Clone the Repository

```bash
git clone https://github.com/your-username/basma-backend.git

cd basma-backend
```

---

# Install Dependencies

```bash
npm install
```

---

# PostgreSQL Setup

## Windows

### Step 1 — Download PostgreSQL

Download PostgreSQL from the official website:

https://www.postgresql.org/download/windows/

Run the installer.

During installation:

- Keep Port **5432**
- Install **pgAdmin**
- Remember the password you create for the **postgres** user

Example:

```
Username:
postgres

Password:
YourPassword123
```

---

### Step 2 — Open pgAdmin

Connect to your PostgreSQL server using the password you created.

---

### Step 3 — Create Database

Right click

```
Databases
```

↓

```
Create

↓

Database
```

Database Name

```
basma_db
```

Owner

```
postgres
```

Save.

---

### Step 4 — Create Project User (Optional)

Open Query Tool.

Run

```sql
CREATE USER basma_user
WITH PASSWORD 'StrongPassword123!';
```

Grant privileges

```sql
GRANT ALL PRIVILEGES
ON DATABASE basma_db
TO basma_user;
```

---

## Linux (Ubuntu)

Install PostgreSQL

```bash
sudo apt update

sudo apt install postgresql postgresql-contrib
```

Start PostgreSQL

```bash
sudo systemctl start postgresql
```

Enable PostgreSQL

```bash
sudo systemctl enable postgresql
```

Login

```bash
sudo -u postgres psql
```

Create user

```sql
CREATE USER basma_user
WITH ENCRYPTED PASSWORD 'StrongPassword123!';
```

Create database

```sql
CREATE DATABASE basma_db
OWNER basma_user;
```

Grant privileges

```sql
GRANT ALL PRIVILEGES
ON DATABASE basma_db
TO basma_user;
```

Exit

```sql
\q
```

---

## macOS

Install

```bash
brew install postgresql@15
```

Start PostgreSQL

```bash
brew services start postgresql@15
```

Create database

```bash
createdb basma_db
```

---

# Environment Variables

Copy

```bash
cp .env.example .env
```

Open `.env`

Example

```env
NODE_ENV=development

PORT=5000

APP_URL=http://localhost:5000

FRONTEND_URL=http://localhost:3000

# PostgreSQL

DB_HOST=localhost

DB_PORT=5432

DB_NAME=basma_db

DB_USER=postgres

DB_PASSWORD=YourPassword123

# JWT

JWT_SECRET=your_super_secret_key

JWT_EXPIRES_IN=7d

JWT_REFRESH_SECRET=your_refresh_secret

JWT_REFRESH_EXPIRES_IN=30d

# OTP (Manager Signup Only)

OTP_EXPIRES_MINUTES=10

# Email

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_USER=yourgmail@gmail.com

SMTP_PASS=YourGmailAppPassword

SMTP_FROM=Basma HR <yourgmail@gmail.com>

# OAuth

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

FACEBOOK_APP_ID=

FACEBOOK_APP_SECRET=

FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Uploads

UPLOAD_PATH=./uploads

MAX_FILE_SIZE_MB=10
```

---

# Gmail App Password

Do **NOT** use your Gmail password.

Enable

```
Google Account

↓

Security

↓

2-Step Verification

↓

App Passwords
```

Generate an App Password.

Example

```
abcd efgh ijkl mnop
```

Use it as

```
SMTP_PASS=
```

---

# Database Migration

Run

```bash
npm run db:migrate
```

This will create the following tables:

- companies
- users
- departments
- branches
- hr_invitations
- employee_invitations
- refresh_tokens
- otp_codes *(Manager signup only)*
- employee_documents

---

# Verify Database

Open terminal

```bash
psql -U postgres
```

Connect

```sql
\c basma_db
```

Show tables

```sql
\dt
```

You should see something similar to

```
companies

users

departments

branches

hr_invitations

employee_invitations

employee_documents

otp_codes

refresh_tokens
```

---

# Running the Project

Development

```bash
npm run dev
```

Production

```bash
npm start
```

If everything is correct you should see

```
Server running on port 5000

Database connected successfully
```

---

# Project URLs

Backend

```
http://localhost:5000
```

API Base URL

```
http://localhost:5000/api
```

Uploads

```
http://localhost:5000/uploads
```

---

# Testing Using Postman

Create a new Environment.

Variables

| Variable | Value |
|-----------|-------|
| base_url | http://localhost:5000/api |
| token | *(leave empty initially)* |

---

Every protected request should include

```
Authorization

Bearer {{token}}
```

---

# Recommended Testing Order

1. Manager Signup
2. Verify Manager OTP
3. Manager Dashboard Authentication
4. Create Departments
5. Invite HR Members
6. HR Accept Invitation
7. HR Login
8. Add Employee
9. Employee Accept Invitation
10. Employee Login
11. Upload Employee Documents
12. Update Profile
13. Refresh Token
14. Logout

Following this order ensures all required data exists before testing dependent APIs.

---
# Authentication Flow

The Basma HR Management System supports three types of users:

- Manager
- HR
- Employee

Each role has its own registration and onboarding flow.

---

# Manager Registration Flow

The manager is responsible for creating a company and inviting HR members.

Unlike HR and Employees, the Manager verifies their email using an OTP during registration.

## Flow

```
Manager opens Sign Up page

        ↓

Enter

• Name
• Email
• Phone Number
• Password
• Company Information

        ↓

POST /api/auth/manager/signup

        ↓

OTP sent to Manager email

        ↓

POST /api/auth/verify-otp/signup

        ↓

Manager account verified

        ↓

Automatically authenticated
(No login required)

        ↓

Redirect to Company Setup

        ↓

Create Company Departments

        ↓

Invite one or more HR members

Each HR requires:
• Email
• Branch

        ↓

Click "Register & Send Invitations"

        ↓

Invitation emails sent

        ↓

Redirect to Dashboard
```

---

# HR Invitation Flow

HR users cannot create accounts themselves.

Only Managers can invite HR members.

## Flow

```
Manager sends invitation

        ↓

HR receives invitation email

        ↓

Clicks invitation link

        ↓

Invitation page

        ↓

Accept Invitation

        ↓

Registration page

        ↓

Enter

• Name
• Phone Number
• Password
• Confirm Password

        ↓

Account activated

        ↓

Redirect to Login

        ↓

POST /api/auth/login

        ↓

Dashboard
```

> HR registration does **not** require OTP verification.

---

# Employee Invitation Flow

Employees are created by Managers or HR members.

## Flow

```
Manager / HR creates employee

        ↓

Invitation email sent

        ↓

Employee clicks invitation link

        ↓

Create Password

        ↓

Account activated

        ↓

Redirect to Login

        ↓

POST /api/auth/login

        ↓

Dashboard
```

Employee registration does **not** require OTP verification.

---

# Authentication Summary

| User | OTP Required | Invitation Required | Login After Registration |
|---------|-------------|---------------------|---------------------------|
| Manager | ✅ Yes | ❌ No | ❌ No (Automatically Logged In) |
| HR | ❌ No | ✅ Yes | ✅ Yes |
| Employee | ❌ No | ✅ Yes | ✅ Yes |

---

# API Documentation

Base URL

```
http://localhost:5000/api
```

All protected endpoints require

```
Authorization: Bearer <access_token>
```

---

# Authentication APIs

---

## POST /auth/manager/signup

Registers a new company manager.

After successful registration an OTP is sent to the manager's email.

### Request

```json
{
  "name": "Mohamed Ali",
  "email": "manager@company.com",
  "phone": "01012345678",
  "password": "Password@123",
  "company_name": "Tech Corp",
  "company_type": "Software"
}
```

---

### Success Response

```json
{
  "success": true,
  "message": "OTP sent successfully.",
  "data": {
    "email": "manager@company.com"
  }
}
```

---

## POST /auth/verify-otp/signup

Verifies the manager's email address.

### Request

```json
{
  "email": "manager@company.com",
  "otp": "123456"
}
```

---

### Success Response

```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "refreshToken": "JWT_REFRESH_TOKEN",
    "user": {
      "id": "uuid",
      "role": "manager",
      "email": "manager@company.com"
    }
  }
}
```

> The backend automatically authenticates the manager after OTP verification. The frontend should redirect the user directly to the Company Setup page.

---

## POST /auth/resend-otp

Resends the signup OTP to the manager.

### Request

```json
{
  "email": "manager@company.com"
}
```

---

### Response

```json
{
  "success": true,
  "message": "OTP sent successfully."
}
```

---

## POST /auth/login

Login endpoint for all users.

Supported roles:

- Manager
- HR
- Employee

### Request

```json
{
  "email": "user@company.com",
  "password": "Password@123"
}
```

---

### Success Response

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "refreshToken": "JWT_REFRESH_TOKEN",
    "user": {
      "id": "uuid",
      "name": "Mohamed Ali",
      "role": "manager"
    }
  }
}
```

---

## POST /auth/refresh-token

Returns a new access token using the refresh token.

### Request

```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

---

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN"
  }
}
```

---

## POST /auth/logout

Logs the current user out.

### Request

```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

---

### Response

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## GET /auth/me

Returns the authenticated user's profile.

Authorization required.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mohamed Ali",
    "email": "manager@company.com",
    "role": "manager",
    "company": "Tech Corp"
  }
}
```
# Company Setup APIs

After the manager verifies the OTP, they are automatically logged in and redirected to the Company Setup page.

On this page the manager can:

- Create departments
- Invite one or more HR members
- Assign a branch to each HR

After submission, invitation emails are sent automatically.

---

# Company Setup Flow

```
Manager verifies OTP

↓

Automatically authenticated

↓

Company Setup Page

↓

Create Departments

↓

Add HR Members

↓

Send Invitations

↓

Dashboard
```

---

# POST /company/setup

Creates company departments and invites HR members.

**Authorization**

```
Bearer <accessToken>
```

Manager only.

---

## Request

```json
{
  "departments": [
    "Human Resources",
    "IT",
    "Finance",
    "Marketing"
  ],
  "hrs": [
    {
      "email": "hr1@company.com",
      "branch": "Cairo"
    },
    {
      "email": "hr2@company.com",
      "branch": "Alexandria"
    }
  ]
}
```

---

## Success Response

```json
{
  "success": true,
  "message": "Company setup completed successfully.",
  "data": {
    "departmentsCreated": 4,
    "hrsInvited": 2
  }
}
```

---

# Department APIs

---

## GET /departments

Returns all company departments.

Authorization required.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "IT"
    },
    {
      "id": "uuid",
      "name": "HR"
    }
  ]
}
```

---

## POST /departments

Create a new department.

Authorization

Manager only.

### Request

```json
{
    "name":"Accounting"
}
```

---

### Response

```json
{
    "success":true,
    "message":"Department created successfully."
}
```

---

## PUT /departments/:id

Update department name.

### Request

```json
{
    "name":"Operations"
}
```

---

## DELETE /departments/:id

Delete department.

Response

```json
{
    "success":true,
    "message":"Department deleted successfully."
}
```

---

# HR Management APIs

Only managers can manage HR members.

---

## POST /hr

Invite a new HR member.

---

### Request

```json
{
    "email":"sara@company.com",
    "branch":"Alexandria"
}
```

---

### Success Response

```json
{
    "success":true,
    "message":"Invitation email sent successfully."
}
```

---

Invitation email contains:

```
Hello Sara,

You have been invited to join Basma HR.

Click the button below to complete your registration.

Accept Invitation
```

---

# GET /hr

Returns all HR members.

### Response

```json
{
    "success":true,
    "data":[
        {
            "id":"uuid",
            "email":"hr1@company.com",
            "branch":"Cairo",
            "status":"Active"
        },
        {
            "id":"uuid",
            "email":"hr2@company.com",
            "branch":"Alexandria",
            "status":"Pending"
        }
    ]
}
```

---

# DELETE /hr/:id

Deletes an HR member.

### Response

```json
{
    "success":true,
    "message":"HR removed successfully."
}
```

---

# POST /hr/resend-invitation/:id

Resends invitation email.

### Response

```json
{
    "success":true,
    "message":"Invitation resent successfully."
}
```

---

# HR Invitation APIs

---

## GET /auth/invitation/:token

Checks whether an invitation token is valid.

---

### Response

```json
{
    "success":true,
    "data":{
        "email":"hr@company.com",
        "branch":"Alexandria",
        "company":"Tech Corp"
    }
}
```

---

## POST /auth/invitation/accept

Completes HR registration.

### Request

```json
{
    "token":"INVITATION_TOKEN",
    "name":"Sara Ahmed",
    "phone":"01012345678",
    "password":"Password@123",
    "confirmPassword":"Password@123"
}
```

---

### Success Response

```json
{
    "success":true,
    "message":"Registration completed successfully."
}
```

---

After registration:

```
Redirect

↓

Login Page

↓

POST /auth/login

↓

Dashboard
```

---

# HR Invitation Lifecycle

```
Manager

↓

Invite HR

↓

Email Sent

↓

Accept Invitation

↓

Complete Registration

↓

Login

↓

Dashboard
```

---

# Validation Rules

## Department

- Required
- Maximum 100 characters
- Must be unique per company

---

## HR Email

- Required
- Valid email
- Must not already exist

---

## Branch

- Required
- Maximum 100 characters

---

## Password

Minimum 8 characters

Must contain:

- Uppercase letter
- Lowercase letter
- Number
- Special character

Example

```
Password@123
```
# Employee Management APIs

Employees can be created by either a **Manager** or an **HR** user.

When an employee is created:

1. An employee record is created.
2. An invitation email is sent.
3. The employee clicks the invitation link.
4. The employee creates a password.
5. The employee logs into the system.

> Employee registration does **not** require OTP verification.

---

## Employee Flow

```
Manager / HR

↓

Create Employee

↓

Invitation Email

↓

Employee clicks invitation

↓

Create Password

↓

Login

↓

Employee Dashboard
```

---

# POST /employees

Creates a new employee and sends an invitation email.

## Authorization

Manager or HR

```
Authorization: Bearer <accessToken>
```

---

## Request

```json
{
    "name":"Ahmed Mohamed",
    "email":"ahmed@company.com",
    "phone":"01012345678",
    "department":"IT",
    "branch":"Cairo",
    "job_title":"Frontend Developer",
    "employment_type":"Full Time",
    "hire_date":"2026-06-01"
}
```

---

## Success Response

```json
{
    "success":true,
    "message":"Employee created successfully. Invitation email sent."
}
```

---

# GET /employees

Returns all company employees.

Supports:

- Pagination
- Search
- Filtering

Example

```
GET /employees?page=1&limit=20
```

or

```
GET /employees?search=Ahmed
```

or

```
GET /employees?department=IT
```

---

### Response

```json
{
    "success":true,
    "data":{
        "employees":[
            {
                "id":"uuid",
                "name":"Ahmed Mohamed",
                "email":"ahmed@company.com",
                "department":"IT",
                "branch":"Cairo",
                "status":"Active"
            }
        ],
        "pagination":{
            "page":1,
            "pages":5,
            "total":84
        }
    }
}
```

---

# GET /employees/:id

Returns complete employee information.

### Response

```json
{
    "success":true,
    "data":{
        "id":"uuid",
        "name":"Ahmed Mohamed",
        "email":"ahmed@company.com",
        "phone":"01012345678",
        "department":"IT",
        "branch":"Cairo",
        "job_title":"Frontend Developer",
        "employment_type":"Full Time",
        "hire_date":"2026-06-01",
        "documents":[]
    }
}
```

---

# PUT /employees/:id

Updates employee information.

### Request

```json
{
    "phone":"01099999999",
    "department":"Software",
    "job_title":"Senior Frontend Developer"
}
```

---

### Response

```json
{
    "success":true,
    "message":"Employee updated successfully."
}
```

---

# DELETE /employees/:id

Deletes an employee.

### Response

```json
{
    "success":true,
    "message":"Employee deleted successfully."
}
```

---

# PATCH /employees/:id/status

Activate or deactivate an employee.

### Request

```json
{
    "is_active":false
}
```

---

### Response

```json
{
    "success":true,
    "message":"Employee status updated successfully."
}
```

---

# Employee Invitation APIs

---

## GET /auth/employee/invitation/:token

Validates the employee invitation.

### Response

```json
{
    "success":true,
    "data":{
        "email":"employee@company.com",
        "company":"Tech Corp"
    }
}
```

---

## POST /auth/employee/invitation/accept

Creates employee password.

### Request

```json
{
    "token":"INVITATION_TOKEN",
    "password":"Password@123",
    "confirmPassword":"Password@123"
}
```

---

### Response

```json
{
    "success":true,
    "message":"Password created successfully."
}
```

---

After success

```
Redirect

↓

Login

↓

Dashboard
```

---

# Employee Documents

Managers and HR users can upload employee documents.

Supported file types

- PDF
- PNG
- JPG
- JPEG

Maximum file size

```
10 MB
```

---

# POST /employees/:id/documents

Uploads employee documents.

Content Type

```
multipart/form-data
```

Field

```
documents
```

Multiple files supported.

---

### Response

```json
{
    "success":true,
    "message":"Documents uploaded successfully."
}
```

---

# GET /employees/:id/documents

Returns employee documents.

### Response

```json
{
    "success":true,
    "data":[
        {
            "id":"uuid",
            "file_name":"Contract.pdf",
            "file_url":"/uploads/documents/contract.pdf"
        }
    ]
}
```

---

# DELETE /employees/:id/documents/:documentId

Deletes a document.

### Response

```json
{
    "success":true,
    "message":"Document deleted successfully."
}
```

---

# Profile APIs

Every authenticated user can manage their own profile.

---

## GET /profile

Returns current user profile.

### Response

```json
{
    "success":true,
    "data":{
        "id":"uuid",
        "name":"Mohamed Ali",
        "email":"manager@company.com",
        "phone":"01012345678",
        "role":"manager"
    }
}
```

---

## PUT /profile

Updates user profile.

Content Type

```
multipart/form-data
```

Fields

```
name

phone

profile_image
```

---

### Response

```json
{
    "success":true,
    "message":"Profile updated successfully."
}
```

---

## PUT /profile/change-password

Changes current password.

### Request

```json
{
    "currentPassword":"OldPassword@123",
    "newPassword":"NewPassword@123",
    "confirmPassword":"NewPassword@123"
}
```

---

### Response

```json
{
    "success":true,
    "message":"Password updated successfully."
}
```

---

# Authorization Matrix

| API | Manager | HR | Employee |
|------|:------:|:--:|:--------:|
| Company Setup | ✅ | ❌ | ❌ |
| Departments | ✅ | ❌ | ❌ |
| Invite HR | ✅ | ❌ | ❌ |
| View HR | ✅ | ❌ | ❌ |
| Add Employee | ✅ | ✅ | ❌ |
| Edit Employee | ✅ | ✅ | ❌ |
| Upload Documents | ✅ | ✅ | ❌ |
| Profile | ✅ | ✅ | ✅ |

---
# Postman Testing Guide

This section describes the recommended order for testing all APIs.

---

## Step 1 — Manager Registration

### Endpoint

```
POST /auth/manager/signup
```

Expected Result

- Manager account created
- OTP sent to manager email

---

## Step 2 — Verify Manager OTP

### Endpoint

```
POST /auth/verify-otp/signup
```

Expected Result

- Email verified
- Access Token returned
- Refresh Token returned
- Manager automatically authenticated

Save

```
accessToken
```

inside Postman Environment.

---

## Step 3 — Company Setup

### Endpoint

```
POST /company/setup
```

Authorization

```
Bearer {{accessToken}}
```

Body

```json
{
  "departments":[
    "HR",
    "IT",
    "Finance",
    "Marketing"
  ],
  "hrs":[
    {
      "email":"hr1@company.com",
      "branch":"Cairo"
    },
    {
      "email":"hr2@company.com",
      "branch":"Alexandria"
    }
  ]
}
```

Expected Result

- Departments created
- HR invitations sent

---

## Step 4 — HR Accept Invitation

Open invitation link from email.

Call

```
POST /auth/invitation/accept
```

Expected Result

- Password created
- Redirect to Login

---

## Step 5 — HR Login

```
POST /auth/login
```

Save HR Access Token.

---

## Step 6 — Create Employee

```
POST /employees
```

Authorization

```
Bearer HR_ACCESS_TOKEN
```

Expected Result

- Employee created
- Invitation email sent

---

## Step 7 — Employee Accept Invitation

```
POST /auth/employee/invitation/accept
```

Expected Result

- Password created

---

## Step 8 — Employee Login

```
POST /auth/login
```

Expected Result

- Employee Dashboard

---

## Step 9 — Upload Documents

```
POST /employees/{id}/documents
```

Upload

- PDF
- Images

Verify

```
GET /employees/{id}
```

---

## Step 10 — Logout

```
POST /auth/logout
```

---

# Database Schema

## companies

Stores company information.

| Column | Type |
|---------|------|
| id | UUID |
| name | VARCHAR |
| company_type | VARCHAR |
| logo | TEXT |
| created_at | TIMESTAMP |

---

## users

Stores all users.

Roles

- Manager
- HR
- Employee

| Column | Type |
|---------|------|
| id | UUID |
| name | VARCHAR |
| email | VARCHAR |
| phone | VARCHAR |
| password | TEXT |
| role | ENUM |
| company_id | UUID |
| branch | VARCHAR |
| is_active | BOOLEAN |
| created_at | TIMESTAMP |

---

## departments

Stores departments belonging to a company.

| Column | Type |
|---------|------|
| id | UUID |
| company_id | UUID |
| name | VARCHAR |

---

## hr_invitations

Stores pending HR invitations.

| Column | Type |
|---------|------|
| id | UUID |
| email | VARCHAR |
| branch | VARCHAR |
| token | UUID |
| expires_at | TIMESTAMP |

---

## employee_invitations

Stores pending employee invitations.

---

## employee_documents

Stores uploaded employee files.

---

## refresh_tokens

Stores refresh tokens.

---

## otp_codes

Used **only** for Manager email verification during signup.

---

# Database Relationships

```
Company
│
├── Departments
│
├── Managers
│
├── HR Members
│
└── Employees
        │
        └── Documents
```

---

# Security

The application includes:

- JWT Authentication
- Refresh Tokens
- bcrypt Password Hashing
- Helmet
- CORS
- Rate Limiting
- Input Validation
- SQL Injection Protection
- Secure HTTP Headers
- Environment Variables
- Invitation Token Expiration
- Email Verification (Manager Only)

---

# File Upload Restrictions

Supported Types

- JPG
- JPEG
- PNG
- PDF

Maximum Size

```
10 MB
```

---

# Error Responses

## 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed."
}
```

---

## 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized."
}
```

---

## 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied."
}
```

---

## 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found."
}
```

---

## 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error."
}
```

---

# NPM Scripts

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Run production server

```bash
npm start
```

Run database migrations

```bash
npm run db:migrate
```

---

# Deployment

Before deployment ensure:

- PostgreSQL database is running
- Environment variables are configured
- Gmail App Password is configured
- OAuth credentials are configured
- Upload directory exists
- Database migrations have been executed

---

# Future Improvements

- Two-Factor Authentication (2FA)
- Email Templates Editor
- Attendance Management
- Leave Management
- Payroll Module
- Notifications
- Audit Logs
- Analytics Dashboard
- Multi-language Support
- Docker Support
- CI/CD Pipeline

---

# License

This project is licensed under the MIT License.

---

# Author

Developed for the **Basma HR Management System** project.

---

# Support

If you encounter any issues:

1. Check the application logs.
2. Verify PostgreSQL is running.
3. Verify environment variables.
4. Ensure database migrations have completed.
5. Confirm Gmail SMTP credentials are valid.

---

# Project Flow Summary

```
Manager Signup
        │
        ▼
Email OTP Verification
        │
        ▼
Automatically Logged In
        │
        ▼
Company Setup
 ├── Create Departments
 └── Invite HR Members
        │
        ▼
Dashboard
        │
        ├──────── Invite HR
        │               │
        │               ▼
        │        Accept Invitation
        │               │
        │               ▼
        │         Create Password
        │               │
        │               ▼
        │             Login
        │
        └──────── Add Employee
                        │
                        ▼
               Invitation Email
                        │
                        ▼
                Create Password
                        │
                        ▼
                     Login
```

---

<p align="center">
Built with ❤️ using Node.js, Express.js, and PostgreSQL.
</p>