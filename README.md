# 🚀 AI SEO Automation Platform

A production-ready SaaS platform for digital marketing agencies to automate SEO reporting using n8n workflows and AI (GPT-4).

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?style=flat-square&logo=openai)

## ✨ Features

- **🔐 Authentication** — Supabase Auth with role-based access control
- **👥 Client Management** — Full CRUD with logo uploads, brand colors, industry tracking
- **📊 Report Requests** — Submit SEO reports with Excel upload, keywords, and custom AI instructions
- **⚡ n8n Integration** — Trigger automation workflows via webhook; receive callbacks
- **🤖 AI Analysis** — GPT-4 powered executive summaries, insights, and recommendations
- **📄 Report Viewer** — Rich report display with metrics, insights, and downloadable PDFs
- **🌙 Dark/Light Mode** — System-aware theme switching
- **🐳 Docker Ready** — Production Dockerfile + docker-compose with n8n bundled

---

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key (GPT-4 access)
- n8n instance (self-hosted or cloud) — optional but recommended

---

## 🛠️ Local Setup (5 minutes)

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/ai-seo-platform.git
cd ai-seo-platform
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values (see [Environment Variables](#-environment-variables) section below).

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:

```bash
# Copy and paste the contents of:
supabase/migrations/001_initial_schema.sql
```

3. Go to **Storage** and create these buckets:
   - `client-logos` (Public)
   - `report-uploads` (Private)
   - `generated-reports` (Private)

4. Copy your project URL and anon key to `.env.local`

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### 5. Create your account

Navigate to `/auth/signup` and create your agency account.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (for admin operations) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (sk-...) |
| `OPENAI_MODEL` | ❌ | Model to use (default: `gpt-4o`) |
| `N8N_WEBHOOK_URL` | ❌ | n8n webhook URL for triggering automations |
| `N8N_WEBHOOK_SECRET` | ❌ | Secret for validating n8n webhooks |
| `N8N_API_URL` | ❌ | n8n API URL for status polling |
| `N8N_API_KEY` | ❌ | n8n API key |
| `NEXT_PUBLIC_APP_URL` | ❌ | Your app's public URL (default: `http://localhost:3000`) |
| `INTERNAL_API_SECRET` | ❌ | Secret for securing internal API routes |

> ⚠️ The app works without `OPENAI_API_KEY` and `N8N_WEBHOOK_URL` — it uses mock data in development mode.

---

## 🔗 Connecting n8n

### Option A: Use Docker Compose (Recommended for local dev)

```bash
# Start both the app and n8n together
cp .env.example .env.local
# Fill in your .env.local values
docker-compose up -d
```

- App runs at: http://localhost:3000
- n8n runs at: http://localhost:5678

### Option B: Connect to existing n8n instance

1. Set `N8N_WEBHOOK_URL` to your n8n webhook URL
2. Set `N8N_WEBHOOK_SECRET` to a secure secret

### Setting up the n8n Workflow

1. Open your n8n instance
2. Create a new workflow
3. Add a **Webhook** trigger node:
   - Method: `POST`
   - Path: `seo-automation`
   - Authentication: Header Auth → `X-Webhook-Secret`
4. Process the payload (fields: `reportRequestId`, `clientName`, `keywords`, `excelFileUrl`, etc.)
5. At the end, add an **HTTP Request** node to call back:
   ```
   POST {{$env.NEXT_PUBLIC_APP_URL}}/api/automation/webhook
   Body: {
     "reportRequestId": "{{$json.reportRequestId}}",
     "status": "completed",
     "data": { ...your processed data... },
     "secret": "{{$env.N8N_WEBHOOK_SECRET}}"
   }
   ```

### Webhook Payload Structure (Sent TO n8n)

```json
{
  "reportRequestId": "uuid",
  "clientId": "uuid",
  "clientName": "Acme Corp",
  "clientWebsite": "https://acme.com",
  "reportType": "monthly_seo",
  "dateRangeStart": "2024-01-01",
  "dateRangeEnd": "2024-01-31",
  "keywords": ["keyword 1", "keyword 2"],
  "workDoneNotes": "Created 5 new blog posts...",
  "customInstructions": "Focus on local SEO metrics",
  "excelFileUrl": "https://...",
  "callbackUrl": "https://yourapp.com/api/automation/webhook",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Callback Payload Structure (Sent FROM n8n)

```json
{
  "reportRequestId": "uuid",
  "status": "completed",
  "secret": "your-webhook-secret",
  "data": {
    "organicTraffic": 8432,
    "keywordsRanking": 247,
    "backlinks": 1847
  }
}
```

---

## 📁 Project Structure

```
ai-seo-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── ai/            # AI analysis endpoints
│   │   │   ├── automation/    # n8n trigger, webhook, retry, status
│   │   │   ├── clients/       # Client CRUD
│   │   │   ├── reports/       # Reports CRUD
│   │   │   ├── uploads/       # File uploads
│   │   │   └── health/        # Health check
│   │   ├── auth/              # Login, Signup pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── clients/           # Client management
│   │   ├── reports/           # Reports list + individual report view
│   │   ├── new-report/        # Report request form
│   │   └── settings/          # Settings page
│   ├── components/
│   │   ├── auth/              # Login/Signup forms
│   │   ├── clients/           # Client card, client form
│   │   ├── dashboard/         # Sidebar, stats cards, activity feed
│   │   ├── reports/           # Report card, new report form, retry button
│   │   ├── settings/          # Profile form, integration status
│   │   ├── shared/            # Status badge
│   │   └── ui/                # Button, Card, Input, Badge, etc.
│   ├── lib/
│   │   ├── ai.ts              # OpenAI service layer
│   │   ├── n8n.ts             # n8n automation service
│   │   ├── env.ts             # Environment validation
│   │   ├── utils.ts           # Utility functions
│   │   ├── validations.ts     # Zod schemas
│   │   └── supabase/          # Supabase clients (browser, server, admin)
│   ├── types/
│   │   └── database.ts        # TypeScript types from DB schema
│   └── middleware.ts           # Auth route protection
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use vercel env pull
```

1. Push to GitHub
2. Import in Vercel Dashboard
3. Add all environment variables from `.env.example`
4. Deploy!

### Docker Self-Host

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Manual Docker

```bash
# Build image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -t ai-seo-platform .

# Run container
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e OPENAI_API_KEY=sk-your-key \
  -e N8N_WEBHOOK_URL=https://your-n8n.com/webhook/seo \
  ai-seo-platform
```

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extended user profiles (extends Supabase auth.users) |
| `clients` | Agency client records |
| `report_requests` | SEO report requests with n8n tracking |
| `report_data` | Raw data received from n8n |
| `reports` | AI-generated final reports |
| `automation_logs` | n8n automation event log |
| `activity_feed` | User activity for dashboard feed |
| `team_members` | Team member invitations & roles |

### Entity Relationships

```
profiles (1) ──── (N) clients
clients (1) ──── (N) report_requests
report_requests (1) ──── (N) report_data
report_requests (1) ──── (1) reports
report_requests (1) ──── (N) automation_logs
```

---

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **Input validation** with Zod schemas on all API routes and forms
- **Route protection** via middleware + Supabase session verification
- **Webhook secret** validation on n8n callbacks
- **Service role key** only used server-side (never exposed to client)
- **Signed URLs** for private file access (7-day expiry)

---

## 🧪 Development Tips

### Running without n8n

The app works without n8n configured — automations are simulated with a mock execution ID. You can manually call the webhook to test:

```bash
curl -X POST http://localhost:3000/api/automation/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "reportRequestId": "your-request-id",
    "status": "completed",
    "data": {
      "organicTraffic": 5000,
      "keywordsRanking": 150
    }
  }'
```

### Running without OpenAI

The app returns rich mock SEO data when `OPENAI_API_KEY` is not set — great for UI development and testing.

### Type Safety

All database operations are fully typed. When you modify the schema, update `src/types/database.ts` to match.

---

## 📊 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/automation/trigger` | Trigger n8n automation |
| `POST` | `/api/automation/retry` | Retry failed automation |
| `POST` | `/api/automation/webhook` | Receive n8n callback |
| `GET` | `/api/automation/status` | Check execution status |
| `GET/POST` | `/api/clients` | List / create clients |
| `GET/PATCH/DELETE` | `/api/clients/[id]` | Individual client ops |
| `GET` | `/api/reports` | List reports |
| `GET/PATCH/DELETE` | `/api/reports/[id]` | Individual report ops |
| `POST` | `/api/ai` | AI analysis actions |
| `POST` | `/api/uploads` | Upload files |
| `GET` | `/api/health` | Health check |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for SEO agencies who value their time.
