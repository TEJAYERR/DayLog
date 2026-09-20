# DayLog Frontend

The frontend application for **DayLog**, a personal daily timeline that combines recorded activities with location events and provides AI-powered insights about the user's day.

## Features

* User registration and login
* JWT-based authentication
* Daily timeline
* Manual activity logging
* Saved places management
* Location event display
* Date-based timeline navigation
* Explain My Day
* Ask My Day
* Loading, error, and empty states
* Responsive UI

## Tech Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router

## Project Structure

```text
daylog-frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Backend

The frontend communicates with the DayLog Spring Boot backend through REST APIs.

By default, the frontend expects the backend at:

```text
http://localhost:8080
```

Configure the API URL using:

```env
VITE_API_URL=http://localhost:8080
```

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The development server runs on:

```text
http://localhost:5173
```

## Authentication

After login, the frontend stores the JWT and sends it with authenticated API requests using:

```http
Authorization: Bearer <JWT>
```

The frontend does not manage user authorization itself. The backend validates the JWT and controls access to user data.

## API Communication

The frontend communicates with the backend using REST APIs.

```text
React Frontend
      ↓
Spring Boot Backend
      ↓
PostgreSQL / Application Services
      ↓
Amazon Bedrock
```

AI requests such as **Explain My Day** and **Ask My Day** are sent through the backend.

The frontend never communicates directly with Amazon Bedrock.

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8080
```

Do not add AWS credentials or other backend secrets to the frontend.

Vite exposes variables prefixed with `VITE_` to the client, so only public configuration should be placed here.

## Related Project

The complete DayLog project contains:

* React frontend
* Spring Boot backend
* Database
* JWT authentication
* Location-based timeline events
* Amazon Bedrock AI integration

See the root project README for the complete architecture, backend setup, AWS integration, and deployment information.
