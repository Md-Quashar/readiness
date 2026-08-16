# EEE Portal — REST API Reference

Base URL: `http://localhost:8000`

---

## Auth Service  `/auth/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | Public | Register new user and obtain JWT tokens|
| POST | `/auth/login/` | Public | user login with email and password Obtain JWT tokens |
| GET  | `/auth/profile/` | User | Get own profile |
| GET  | `/auth/get-user/` | Admin | List all users |


---

## Questions Service  `/questions/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/questions/active/` | Admin | Active questions for assessment |
| PATCH| `/questions/{id}/toggle-active/` | Admin | Soft enable/disable |
| POST | `/questions/create/` | Admin | Create queation |
| PUT  | `/questions/update/` | Admin | update questions |



---

## Responses Service  `/responses/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST  | `/responses/submission/` | User | Submit assessment responses for the user |
| DELETE | `/responses/{id}/delete-response/` | Admin | delete records of user having id is id |
| GET| `/responses/{id}/get-response` | Admin | get the records of a user  |
| 

