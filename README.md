# Evently – Smart Event Management Platform

Full-stack MERN app for technical events, workshops and hackathons.

**Stack:** React (Vite) · Tailwind CSS · Node.js · Express · MongoDB (Mongoose) · JWT · QR Code API (`qrcode`, `html5-qrcode`) · PDFKit

## Features
- JWT auth with three roles: organizer, volunteer, participant
- Event CRUD, search/filter, capacity limits, one registration per user
- QR ticket generation per registration (downloadable / printable)
- QR-based attendance: volunteers scan with the camera or type the ticket code
- PDF certificate generation (unlocked after check-in)
- Role-based dashboards (organizer, volunteer, participant)
- Analytics (registrations vs attendance, attendance rate, average rating), CSV export
- In-app notifications (registration, check-in, organizer broadcasts)
- Feedback collection (attendees only, one per event)

## Run it
Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
# 1. API
cd server && npm install
# edit .env (MONGO_URI, JWT_SECRET)
npm run dev          # http://localhost:5000

# 2. Frontend (new terminal)
cd client && npm install
npm run dev          # http://localhost:5173
```

## Try the full flow
1. Sign up as **organizer**, **volunteer** and **participant** (3 accounts).
2. Organizer: publish an event, then "Add volunteer" using the volunteer's email.
3. Participant: register for the event, open "View ticket" to see the QR.
4. Volunteer: scan the QR (or paste the code) on the check-in desk.
5. Participant: download the certificate and leave feedback.
6. Organizer: view analytics, participants, feedback, send a notification.

## API overview
| Route | Purpose |
|---|---|
| `POST /api/auth/register`, `/login`, `GET /me` | Auth |
| `GET/POST/PUT/DELETE /api/events`, `GET /events/mine`, `POST /events/:id/volunteers` | Events |
| `POST /api/registrations/event/:id`, `GET /mine`, `GET /:id/ticket`, `GET /:id/certificate` | Registration, ticket, certificate |
| `POST /api/attendance/scan` | QR check-in |
| `POST/GET /api/feedback/event/:id` | Feedback |
| `GET /api/notifications`, `PUT /read-all`, `POST /broadcast/:eventId` | Notifications |
| `GET /api/analytics/organizer` | Analytics |

Note: sign-up lets anyone pick the organizer role so the demo works out of the box. For production, restrict that role to admin approval.
