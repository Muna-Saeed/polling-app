# Next.js Polling App with Supabase Authentication

This is a polling application built with Next.js and Supabase for authentication and database storage.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

## Authentication System

The authentication system uses Supabase Auth and includes:

- User registration with email/password
- User login with email/password
- Protected routes with middleware
- Authentication context for managing user state

### Authentication Flow

1. Users can register at `/auth/register`
2. Users can login at `/auth/login`
3. Protected routes redirect to login if not authenticated
4. Auth routes redirect to home if already authenticated

### Database Schema

The application uses the following tables in Supabase:

- `profiles`: User profile information
- `polls`: Poll data created by users
- `options`: Options for each poll
- `votes`: User votes on poll options

## Project Structure

- `/app`: Next.js app router pages
- `/components`: React components
- `/context`: React context providers
- `/lib`: Utility functions and API clients
- `/middleware.ts`: Authentication middleware

## Development

To add new features or modify existing ones, refer to the component structure and authentication flow described above.
