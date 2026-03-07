# Meal Commerce API (Backend)

Backend for the Meal Commerce. 
This repository focuses on the API layer (authentication, users, meals, cart, orders, and admin operations).

## Table of Contents

- [Production Deployment](#production-deployment)
- [Frontend Note](#frontend-note)
- [Team](#team)
- [Backend Scope](#backend-scope)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [1. Prerequisites](#1-prerequisites)
- [2. Install](#2-install)
- [3. Environment Variables](#3-environment-variables)
- [4. Run](#4-run)
- [API Overview](#api-overview)
- [Auth (`/auth`)](#auth-auth)
- [Users (`/users`)](#users-users)
- [Categories (`/categories`)](#categories-categories)
- [Meals (`/meals`)](#meals-meals)
- [Reviews (`/reviews`)](#reviews-reviews)
- [Cart (`/cart`)](#cart-cart)
- [Orders (`/orders`)](#orders-orders)
- [Uploads and Media](#uploads-and-media)
- [Error Handling](#error-handling)
- [Scripts](#scripts)
- [License](#license)

## Production Deployment

- URL: [https://meal-commerce-api-production.up.railway.app/](https://meal-commerce-api-production.up.railway.app/)

## Frontend Note

- The frontend client is built with **Angular** and is located in the `frontend/` directory.

## Team

| Member | Role | GitHub |
| --- | --- | --- |
| Amr Mohammed | Team Leader | [github.com/amrmohamed-dev](https://github.com/amrmohamed-dev) |
| Marwan Abdelruhman | Backend Team Member | [github.com/marrwan20](https://github.com/marrwan20) |
| Mohammed Hamdy | Backend Team Member | [github.com/Mohamed2247](https://github.com/Mohamed2247) |
| Rodina Ahmed | Backend Team Member | [github.com/rodinaahmedgamaleldin](https://github.com/rodinaahmedgamaleldin) |

## Backend Scope

- JWT authentication using secure HTTP-only cookies
- OTP-based email verification and password recovery
- Role-based access control (`user`, `admin`)
- Meal and category management with Cloudinary image upload
- Reviews with automatic meal rating aggregation
- Cart and order workflow with order status management
- Centralized error handling for operational and validation errors

## Tech Stack

- Node.js `22.x`
- Express `5`
- MongoDB + Mongoose
- Joi validation
- JWT + bcrypt
- Nodemailer (Gmail transport)
- Cloudinary (image storage)
- Multer (memory upload, max 7MB)

## Project Structure

```txt
backend/
  config/          # DB, env, cloudinary config
  middlewares/     # auth, upload, validation, error middleware
  modules/
    auth/
    user/
    category/
    meal/
    review/
    cart/
    order/
    email/
  services/        # cloudinary helpers
  utils/error/     # AppError, async wrapper, process handlers
  app.js
  server.js
```

## Getting Started

### 1. Prerequisites

- Node.js `22.x`
- pnpm
- MongoDB (Atlas or local)
- Cloudinary account
- Gmail account with app password (for OTP emails)

### 2. Install

```bash
pnpm install
```

### 3. Environment Variables

Create `.env` in the project root:

```env
PORT=3000

DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@cluster.mongodb.net/meal-commerce
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_db_password
DB_LOCAL=mongodb://127.0.0.1:27017/meal-commerce

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Notes:
- The current DB connection uses `DATABASE` with `<USERNAME>` and `<PASSWORD>` replacement from env vars.
- `DB_LOCAL` exists in env but is not active unless you change `config/db.js`.

### 4. Run

```bash
# development
pnpm dev

# production-like run (nodemon with NODE_ENV=production)
pnpm prod

# standard start
pnpm start
```

Server starts on:

```txt
http://localhost:<PORT>
```

## API Overview

Base path:

```txt
/api/v1
```

Access legend:

- Public: no login required
- Auth: authenticated user (JWT cookie required)
- Verified: authenticated + verified email
- Admin: authenticated admin

### Auth (`/auth`)

- `POST /register` (Public)
- `POST /login` (Public)
- `POST /send-otp/:purpose` (Public for `Password Recovery`, Auth for `Email Confirmation`)
- `POST /verify-otp/:purpose` (Public)
- `PATCH /verify-email` (Auth)
- `PATCH /reset-password` (Public)
- `GET /logout` (Public)

### Users (`/users`)

- `GET /me` (Auth)
- `PATCH /me` (Verified)
- `DELETE /me` (Auth)
- `PATCH /me/update-password` (Verified)
- `GET /me/favourites` (Verified)
- `PATCH /me/favourites/:mealId` (Verified)
- `PATCH /me/photo` (Verified, multipart `image`)
- `DELETE /me/photo` (Verified)
- `GET /` (Admin)
- `POST /` (Admin)
- `GET /:id` (Admin)
- `PATCH /:id` (Admin)
- `DELETE /:id` (Admin)
- `PATCH /:id/role` (Admin)

### Categories (`/categories`)

- `GET /` (Public)
- `GET /:id` (Public)
- `POST /` (Admin, optional multipart `image`)
- `PATCH /:id` (Admin, optional multipart `image`)
- `DELETE /:id` (Admin)

### Meals (`/meals`)

- `GET /` (Public, optional query `categoryId`)
- `GET /:id` (Public)
- `POST /` (Admin, multipart `image` required)
- `PATCH /:id` (Admin, optional multipart `image`)
- `DELETE /:id` (Admin)

### Reviews (`/reviews`)

- `GET /` (Public, optional query `mealId`)
- `GET /:id` (Public)
- `POST /` (Verified)
- `PATCH /:id` (Verified, owner only)
- `DELETE /:id` (Verified, owner or admin)

### Cart (`/cart`)

- `GET /` (Verified)
- `POST /` (Verified)
- `PATCH /:mealId` (Verified)
- `DELETE /:mealId` (Verified)
- `DELETE /clear` (Verified)

### Orders (`/orders`)

- `POST /` (Verified)
- `GET /me` (Verified)
- `GET /:id` (Verified, owner or admin)
- `PATCH /:id/cancel` (Verified, owner, only pending/confirmed)
- `GET /stats` (Admin)
- `GET /` (Admin)
- `PATCH /:id/status` (Admin)

## Uploads and Media

- Image uploads use `multipart/form-data`
- Field name is `image`
- Max file size is `7MB`
- Supported type: any `image/*` MIME type
- Stored under Cloudinary folders:
  - `meal-commerce/users`
  - `meal-commerce/categories`
  - `meal-commerce/meals`

## Error Handling

- Consistent `AppError` model for operational errors
- Mongoose cast, duplicate key, validation, JWT, and Multer size errors are normalized
- Development mode returns stack traces
- Production mode returns safe client-facing messages

## Scripts

- `pnpm dev` -> run server with `NODE_ENV=development`
- `pnpm start` -> run server with Node
- `pnpm prod` -> run server with `NODE_ENV=production`
- `pnpm frontend:dev` and `pnpm frontend:build`

## License

MIT
