# Social Media Web Platform

A social media web application where users can create threads, comment, like, follow others, and receive real-time notifications. Built with **Node.js**, **Express**, **MongoDB**, and **React**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Real-Time Notifications](#real-time-notifications)
- [Project Structure](#project-structure)
- [Future Improvements](#future-improvements)

---

## Features

- User authentication and registration
- Public/private user accounts
- Create, update, and archive threads
- Commenting system (comments are threads)
- Like system for threads
- Follow requests with pending/accepted/rejected status
- Notifications for follows, likes, comments, and new threads
- Real-time notifications using Socket.IO
- Pagination for threads and notifications
- Media handling (images stored as binary, videos via URL)

---

## Tech Stack

- **Backend:** Node.js, Express.js, Mongoose (MongoDB)
- **Frontend:** React, Tailwind CSS
- **Real-Time:** Socket.IO
- **Authentication:** JWT & Middleware
- **Validation:** Joi
- **Security:** Helmet, CORS, xss-clean, express-mongo-sanitize, rate limiting
- **Logging:** Morgan

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB >= 5.0
- npm or yarn

cd backend
npm install 
npm run dev

