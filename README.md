# Lunova App

## Modern Jewelry & Souvenir E-commerce Platform

Lunova is a full-stack e-commerce application for premium jewelry and souvenirs, built with a **serverless-first architecture** to ensure scalability, cost-efficiency, and rapid development.

### Serverless Architecture

The application leverages a comprehensive serverless stack:

- **Frontend**: React with Vite, deployed on Netlify's serverless functions
- **Authentication**: Supabase Auth (serverless JWT authentication)
- **Database**: PostgreSQL on Supabase (serverless database)
- **API Layer**: 
  - Supabase Edge Functions for core functionality
  - FastAPI on serverless containers for high-performance product operations
- **Storage**: Supabase Storage for media assets (serverless object storage)
- **Real-time Features**: Supabase Realtime for live updates and notifications

### Key Features

- Multi-language support (English/Japanese)
- Responsive dashboard with product and ticket management
- User settings with customizable preferences
- Weather integration via OpenWeather API
- Secure authentication and user management
- Comprehensive product catalog with advanced filtering

### Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase, FastAPI (Python)
- **Deployment**: Vercel, Render
- **APIs**: RESTful API with FastAPI, Supabase

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# For API development
cd blazingfast-api
pip install -r requirements.txt
python main.py
```

### Serverless Benefits

Our serverless approach provides:

- **Cost Optimization**: Pay only for actual usage
- **Auto-scaling**: Handles traffic spikes without manual intervention
- **Reduced DevOps**: No server management or maintenance
- **Global Availability**: Distributed across edge locations for low latency
- **Rapid Development**: Focus on code, not infrastructure
