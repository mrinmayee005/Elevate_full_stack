# Hospital 2050

AI Powered Multilingual Smart Hospital Ecosystem built with vanilla HTML/CSS/JS, Tailwind, Node.js, Express, MongoDB Atlas, Mongoose, JWT RBAC, Socket.IO, Gemini, Gemini Vision, and Cloudinary.

## What is implemented

- Separate login and signup for doctor, nurse, and patient roles.
- Fixed admin login: username `admin`, password `admin@123`; no admin signup route.
- JWT authentication and RBAC middleware.
- Department system with the required eight departments.
- Patient appointment flow: department, doctor, date, vacant slot, double-booking prevention, queue number, waiting estimate.
- Socket.IO events for appointment notifications, queue updates, emergency alerts, chat, vitals, and bed updates.
- Doctor dashboard APIs for patients, appointments, records, prescriptions, Gemini clinical tools, and emergency alerts.
- Doctor appointment detail workflow with patient profile, report creation, private report notepad, prescription builder, follow-up alerts, and doctor-patient voice transcript insights.
- Nurse APIs for vitals, beds, Gemini summaries, chat, and realtime emergency notifications.
- Nurse monitoring with assigned patient dropdowns, automatic vital priority classification, and smart task list.
- Patient APIs for appointments, queue tracking, records, prescriptions, Gemini text assistance, Gemini Vision medicine scanner, browser notifications, and voice alerts.
- Patient prescription downloads, AI report/prescription explanations, scanned prescription insights, manual medicine reminders, and low medicine stock alerts.
- AI provider fallback: Gemini is tried first when configured; OpenAI is used when `OPENAI_API_KEY` is configured.
- Text-to-speech alerts for AI insights, prescription scans, reminders, low stock, queue alerts, follow-ups, emergency alerts, admissions, and low bed availability.
- Persisted language selector in the sidebar for English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, and Bengali.
- Active appointments and appointment history are separated.
- Doctor admission workflow automatically assigns the next available ICU or General bed.
- Admitted patient data is visible to nurses and admins.
- Admin can add patients from the analytics dashboard.
- Doctor overview shows admitted, completed, and emergency patient counts.
- Doctors can assign nurse tasks for admitted patients; nurse tasks include patient, ward, bed, doctor, priority, and medication/vitals context.
- Admin receives low-bed alerts when available beds for a type are nearly exhausted.
- Admin analytics dashboard with totals, department performance, doctor analytics, and bed analytics.
- MongoDB collections for the requested entities.
- Cloudinary-backed upload service for reports and medicine scan images.
- Deployment files for Vercel frontend and Render backend.

## Local setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill in `MONGODB_URI`, `JWT_SECRET`, and Cloudinary credentials. For AI, set `GEMINI_API_KEY`, `OPENAI_API_KEY`, or both.

4. Seed the database:

```bash
node database/seed.js
```

5. Start the backend:

```bash
npm start
```

6. Open the app from the backend URL:

```bash
http://localhost:5000
```

The backend serves the frontend in local development, which avoids `file://` browser CORS problems. You can still deploy the `frontend` folder to Vercel for production.

The API URL is no longer shown inside the UI. For local use, open the app from `http://localhost:5000` after starting the backend.

Signup is role-aware:

- Patient: occupation, age, gender, blood group, allergies, emergency contact, phone, address.
- Doctor: department, specialization, license number, experience, qualification, consultation room, phone.
- Nurse: department, ward/unit, shift, qualification, experience, phone.

## Demo accounts after seeding

- Admin: `admin` / `admin@123`
- Doctor: `doctor@hospital2050.com` / `doctor@123`
- Nurse: `nurse@hospital2050.com` / `nurse@123`
- Patient: `patient@hospital2050.com` / `patient@123`

## Important AI behavior

AI responses are not mocked. Text, vision, prescription explanation, report explanation, scanned prescription insight, and conversation insight features call a real AI provider at request time. Gemini is tried first when configured; OpenAI is used as fallback when `OPENAI_API_KEY` is available. If no provider works, the relevant AI panel displays the real backend error instead of fabricating a response.
