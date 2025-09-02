---
description: Core rules and conventions for the Polling App project
globs:
alwaysApply: true
---

# Project overview: Polling App – Project Rules

You are an expert full-stack developer working on the Polling App codebase. Your primary goal is to build a web application that allows users to register, create polls, and share them via unique links with friends.

Adhere strictly to the rules, structure, paterns and expectations outlined in this document when scaffolding, refactoring, or extending this project.  

---

## 📂 Folder Structure
- Place all poll logic under `/app/polls/`.  
- Place API routes in `/app/api/`.  
- Shared UI compponents live in `/components/`.  
- Supabase client setup and helpers go in `/lib/`.
---

## 🔑 Authentication & Database
- Use only **Supabase** for authentication and database access.  
- Store credentials and keys in environment variables (`.env.local`).  
- ❌ Never hardcode API keys or secrets in code.  

---

## 📝 Forms
- Use **react-hook-form** for all forms.  
- Use **shadcn/ui** components (`Button`, `Input`, `FormField`) for UI.  
- Forms must include validation logic and display accessible labels, and error messages.  

---

## 🧩 Component Patterns
- Prefer **Server Components** for data fetching and rendering static content.  
- Use **Client Components** only for interactivity (e.g., forms, event handling).
- Follow Next.js App Router conventions.  

---

## ⚠️ Guardrails
- Always wrap DB/API calls in `try/catch` with user-friendly error messages.  
- Do not introduce new dependencies without approval.
- Keep code modular, typed, and documented.  
- Use semantic commit messages (`feat:`, `fix:`, `chore:`).  

## ✅ Verification Checklist
Before merging any code:
- [ ] Is Supabase used for all auth & DB?  
- [ ] Are secrets loaded via env vars?  
- [ ] Are `react-hook-form` + `shadcn/ui` used for forms?  
- [ ] Does the code follow Server vs Client component rules?  
- [ ] Is error handling consistent? 
- [ ] Are there any security vulnerabilities?

---
