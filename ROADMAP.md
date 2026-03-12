# Brain Flows Roadmap

## Backend & Data Persistence

### User profile database
- [ ] **Database for user profiles** – Replace localStorage with a proper backend database to manage:
  - Profile picture (store as file/URL instead of data URL in browser)
  - Display name
  - Email
  - Password (hashed, with proper auth flow)
  - Sync across devices and sessions
