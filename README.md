# 🔐 Sigma PassBook — Enterprise Zero-Knowledge Password Vault

Sigma PassBook is an enterprise-grade, client-side encrypted password manager built with **Vanilla JavaScript**, **WebCrypto API (AES-256-GCM)**, **Tailwind CSS**, and **Supabase Backend**.

---

## ✨ Key Features

- **Zero-Knowledge Architecture (E2EE)**: Data is encrypted client-side using `AES-256-GCM` before being sent to Supabase. Your master password never leaves your browser's RAM.
- **Key Derivation (PBKDF2)**: Derives 256-bit encryption keys using 100,000 iterations of SHA-256 with unique per-vault salts.
- **Cloud Synchronization**: Syncs encrypted ciphertext seamlessly across devices powered by Supabase.
- **Row Level Security (RLS)**: PostgreSQL database policies enforce user-level data isolation.
- **Account Hierarchy**: Main accounts with accordion sub-account breakdown (support for secondary logins, Wi-Fi keys, and API tokens).
- **Security Utilities**: Password mask toggle, clipboard auto-copy, dark mode, and encrypted JSON vault export.
- **Modular Codebase**: Clean, maintainable architecture separating state, encryption, UI, and storage modules.

---

## 🏗️ Architecture & Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                       │
│                                                         │
│  Master Password ──> PBKDF2 (100k SHA256) ──> AES Key   │
│                                                   │     │
│  Vault Payload   ──> AES-256-GCM Encrypt ──> Ciphertext │
└───────────────────────────┬─────────────────────────────┘
                            │ (Only Ciphertext + IV + Salt)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                      │
│                                                         │
│  • Supabase Auth (User Identity)                        │
│  • Postgres DB: vault_items (RLS Enabled)               │
│  • Zero-Knowledge: DB admins see only unreadable bytes  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/inkand-paper/passbook.git
   cd passbook
   ```

2. **Configure Supabase Credentials**:
   Copy `config.example.js` to `config.js` and add your project keys:
   ```bash
   cp config.example.js config.js
   ```

   Update `config.js`:
   ```javascript
   window.PASSBOOK_CONFIG = {
       supabaseUrl: "https://your-project.supabase.co",
       supabaseAnonKey: "your-anon-key"
   };
   ```

3. **Supabase Database Schema Setup**:
   Run the following SQL in your Supabase SQL Editor:
   ```sql
   create table if not exists public.vault_items (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users(id) on delete cascade not null,
     encrypted_payload text not null,
     iv text not null,
     salt text not null,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now()
   );

   alter table public.vault_items enable row level security;

   create policy "Users manage own vault"
     on public.vault_items for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

4. **Launch Locally**:
   Serve the folder with any static HTTP server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```
   Open `http://localhost:8000` in your browser.

---

## 🚀 CI/CD & Deployment

This project includes a **GitHub Actions workflow** (`.github/workflows/deploy.yml`) that automatically tests and deploys the password vault to **GitHub Pages** whenever changes are pushed to `main`.

---

## 📄 License

MIT License. Designed & Built for Enterprise Zero-Knowledge Privacy.
