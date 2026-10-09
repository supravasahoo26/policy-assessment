# Policy Management Technical Assessment

A JavaScript implementation using Node.js, Express, MongoDB/Mongoose, and Worker Threads. The importer is mapped to the sample CSV columns supplied with the assessment.

## Features
- Import `.csv`, `.xlsx`, or `.xls` using `POST /api/upload` (`multipart/form-data`, field `file`). File parsing runs in a Node.js Worker Thread.
- Stores the required entities in separate collections: `agents`, `users`, `user_accounts`, `lob`, `carriers`, and `policies`.
- Also retains useful source columns such as policy mode, producer, premium amounts, policy type, CSR, city, account type, applicant ID, agency ID, and active-client-policy flag.
- Search policies by user's first name or email.
- MongoDB aggregation of policy counts and policies grouped by user.
- CPU utilization sampling; process exits at/above the configured threshold so a process manager can restart it.
- Persistent scheduled messages stored in MongoDB and restored when the server starts.

## Requirements
- Node.js 18 or newer
- MongoDB 6 or newer, locally or MongoDB Atlas

## Run locally
1. Extract the ZIP and open the `policy-assessment` folder in VS Code.
2. Start MongoDB.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and update `MONGO_URI` if needed.
5. Start the API:
   ```bash
   npm start
   ```
   For development with auto-reload: `npm run dev`.
6. Open `http://localhost:3000/health`.

## CSV columns supported
The importer recognizes the supplied names including `agent`, `userType`, `policy_mode`, `producer`, `policy_number`, `premium_amount_written`, `premium_amount`, `policy_type`, `company_name`, `category_name`, `policy_start_date`, `policy_end_date`, `csr`, `account_name`, `email`, `gender`, `firstname`, `city`, `account_type`, `phone`, `address`, `state`, `zip`, `dob`, `primary`, `Applicant ID`, `agency_id`, and `hasActive ClientPolicy`.

`firstname` and `policy_number` are required. Empty optional fields are accepted. `agent` maps to the requested Agent Name; `firstname` maps to User first name; `account_name` maps to Account Name. `producer` is retained on the policy as a separate source field.

A small example matching the provided headers is included as `sample-data.csv`. It contains synthetic sample values; replace it with the assessment's actual file when testing.

## APIs

### Upload CSV/XLSX
```bash
curl -X POST http://localhost:3000/api/upload -F "file=@sample-data.csv"
```

### Search policy by username (first name or email)
```http
GET /api/policies/search?username=Lura
```

### Aggregate policies by user
```http
GET /api/policies/aggregated-by-user
```

### Schedule a message
```http
POST /api/messages/schedule
Content-Type: application/json
```
```json
{
  "message": "Policy reminder",
  "day": "2027-01-10",
  "time": "14:30"
}
```
The supplied day and time are interpreted in the server's local timezone. The scheduler records the message as processed when the scheduled time arrives; this demo logs the message to the server console. In a real deployment, replace that log with the desired delivery action.

### List scheduled messages
```http
GET /api/messages
```

### Health
```http
GET /health
```

## CPU restart
Set these in `.env`:
```env
CPU_THRESHOLD=70
CPU_CHECK_INTERVAL_MS=5000
```

At/above the threshold, the process exits with code 1. Run under a process manager so it restarts automatically, for example:
```bash
npx pm2 start src/server.js --name policy-api
npx pm2 save
```
CPU monitoring is based on host CPU counters and is sampled at the configured interval.

## GitHub submission
Create an empty GitHub repository, then from this project folder run:
```bash
git init
git add .
git commit -m "Complete policy management assessment"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Do not commit `.env`, credentials, or real customer data. `.gitignore` excludes `.env` and uploads.
