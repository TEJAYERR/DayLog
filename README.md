# DayLog

> **Turn your day into a timeline. Understand it. Search it. Remember it.**

DayLog is a personal daily timeline application that combines **where you went** with **what you did**, then uses AI to help you understand and search your recorded day.

> **Hackathon Submission:** DayLog was built for the **First Commit** hackathon, leveraging AWS infrastructure and Amazon Bedrock to power AI-driven insights over user timelines.

Instead of keeping activities, locations, and notes separately, DayLog brings them together into one chronological view of the day.

---

## What is DayLog?

A typical day consists of many small events:

- Going to college
- Attending a lecture
- Having lunch
- Working on a project
- Meeting someone
- Going to the gym
- Returning home

Some of these events are things you explicitly record, while others can be represented as meaningful location events. DayLog combines these events into a single timeline.

For example:

```text
07:00 AM  Woke up
09:02 AM  Arrived at College
10:30 AM  DBMS Lecture
01:15 PM  Lunch
02:00 PM  Project Discussion
05:30 PM  Left College
07:12 PM  Arrived at Orion Hotel
```

This gives the user a simple way to reconstruct what happened during their day.

---

## Why DayLog?

People often remember parts of their day but forget the exact sequence of events. For example:

- Where was I after college?
- What did I do in the afternoon?
- When did I leave a particular place?
- What activities did I record under Study?
- What places did I visit after 10 AM?

DayLog turns these fragmented memories into a searchable timeline. The goal is not simply to track a user's location, but to create a **user-controlled record of their day** that can later be explored and understood.

---

## Core Features

### 1. Daily Timeline

DayLog combines different types of events into one chronological timeline. Events include:

- **Activities:** Manually recorded events (e.g., DBMS Lecture, Lunch, Project Discussion, Gym, Meeting, Study Session).
- **Location Events:** Meaningful location transitions (e.g., Arrived at College, Left College, Arrived at Home, Left Home).

The timeline displays these events together based on their recorded timestamps.

### 2. Saved Places

Users can save meaningful places such as Home, College, Office, Gym, or Orion Hotel. Each saved place contains:

- Name
- Latitude
- Longitude
- Radius

These places can be easily associated with location events.

### 3. Manual Activity Logging

Users can manually record activities during their day. Each activity contains:

- Title
- Description
- Date and time
- Category (Personal, Study, Work, Health, Social, Other)

### 4. Location Events

DayLog represents meaningful location changes instead of storing every individual GPS point. For example:

```text
Outside College → Enter College → Arrived at College
```

If the user remains at the same place, DayLog does not continuously create duplicate events. Location access is intended to remain user-controlled.

---

## AI Features & Use Cases

DayLog uses **Amazon Bedrock** to help users understand and search their recorded timeline. The AI receives the relevant DayLog events for the selected day and generates responses strictly based on those events.

### Explain My Day

The user can select a date and ask DayLog to explain their recorded day. The AI provides a summary, highlights, time breakdown, and observations.

> *"You spent the morning at College, where you recorded a DBMS lecture and a project discussion. You later left College and arrived at Orion Hotel."*

**Strict constraints:** The AI is instructed to use only the information recorded in DayLog. It does not invent locations, people, activities, accomplishments, times, emotions, conversations, or events. If something is not recorded, it explicitly indicates that.

### Ask My Day

Users can ask natural-language questions about their recorded day, such as:

- What did I do today?
- What did I do after college?
- Where did I spend most of my recorded day?
- What activities did I record under Study?

### Reconstructing Your Day

One practical use case is reconstructing a day when you cannot remember where you were or what you did.

**Example:** *"I lost my USB drive. What places did I visit after 10 AM?"*

DayLog could show:

```text
10:30 AM  DBMS Lecture at College
05:30 PM  Left College
07:12 PM  Arrived at Orion Hotel
```

This helps the user retrace their steps without the app making unverified claims about where the drive was lost.

---

## Privacy First

DayLog is designed around user-controlled records. The application does **not** require or request access to:

- WhatsApp
- Telegram
- Email
- Contacts
- Call logs
- Social media

The user controls what activities and places are recorded. Location tracking is intended to be opt-in. The AI only receives the DayLog events supplied by the backend for the requested operation.

---

## Architecture & Technical Details

### How DayLog Works

```text
                    User
                      |
                      v
              React Frontend
                      |
                 REST API
                      |
                      v
              Spring Boot API
                 /         \
                /           \
               v             v
            MySQL      Amazon Bedrock
                           |
                           v
                      AI Response
```

The frontend does not contain AWS credentials and does not communicate directly with Bedrock. All AI requests, authentication, and data logic are securely handled by the backend.

### Backend & AI Architecture

The backend follows a layered architecture:

```text
Controller → Service → Repository → Database
```

For AI operations, the integration is abstracted to keep application logic separate from the specific provider:

```text
Controller -> AiService -> AiProvider -> BedrockAiProvider -> Amazon Bedrock
```

### Technical Stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend  | Java 22, Spring Boot, Spring Web, Spring Data JPA, Spring Security, JWT, BCrypt, Maven |
| Database | MySQL |
| AI       | Amazon Bedrock, AWS SDK for Java 2.x, Amazon Nova models |

### Project Structure

```text
DayLog/
│
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           └── java/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│
├── .gitignore
└── README.md
```

### Authentication

DayLog uses JWT-based authentication. Passwords are hashed using BCrypt. Once logged in, the frontend stores the JWT and sends it as a Bearer token in the `Authorization` header for subsequent requests. All user-specific resources are securely scoped to the authenticated user.

---

## API Overview

### Authentication

| Method | Endpoint             |
|--------|----------------------|
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |
| POST   | `/api/auth/logout`   |

### Places

| Method | Endpoint            |
|--------|---------------------|
| POST   | `/api/places`       |
| GET    | `/api/places`       |
| DELETE | `/api/places/{id}`  |

### Events

| Method | Endpoint                        |
|--------|---------------------------------|
| POST   | `/api/events`                   |
| GET    | `/api/events?date=YYYY-MM-DD`   |
| DELETE | `/api/events/{id}`              |
| POST   | `/api/events/demo-location`     |

### AI & Health

| Method | Endpoint                |
|--------|-------------------------|
| POST   | `/api/ai/explain-day`   |
| POST   | `/api/ai/ask`           |
| GET    | `/api/healthz`          |

---

## Running Locally

### Prerequisites

- Java 22
- Maven
- Node.js
- MySQL

### Environment Configuration

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:8080
```

**Backend** (`backend/.env` or system variables):

```env
JWT_SECRET=your_secret_here
JWT_EXPIRATION_MS=86400000
FRONTEND_ORIGIN=http://localhost:5173

AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

DB_URL=jdbc:mysql://localhost:3306/daylog
DB_USERNAME=root
DB_PASSWORD=your_password
```

> **Note:** Never commit `.env` files or AWS credentials to version control.

### Starting the Application

**Start the backend:**

```bash
cd backend
mvn spring-boot:run
```

Runs on `http://localhost:8080`. Health check at `http://localhost:8080/api/healthz`.

**Start the frontend:**

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

---

## Development Scope & Future Improvements

### Current Hackathon Scope (First Commit)

- User authentication
- Personal places
- Manual activities
- Meaningful location events
- Daily timeline
- AI-powered day explanations and queries using Amazon Bedrock

Unnecessary integrations with private communications are intentionally avoided.

### Future Improvements

- Automatic background location tracking and improved transition detection
- Search across multiple days and cross-day timeline analysis
- Detailed analytics dashboard
- Mobile application
- Cloud deployment

---

## Built For

DayLog was created for the **First Commit** hackathon. It utilizes Amazon Web Services (AWS) infrastructure, with Amazon Bedrock powering the generative AI capabilities to summarize, explain, and query daily timeline events.


> **DayLog turns your day into a timeline by combining where you went with what you did, then uses AI to help you understand and search your recorded day.**
