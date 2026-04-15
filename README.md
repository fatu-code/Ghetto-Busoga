# BGS — Busoga Ghetto Structure Disbursement System
## Full Deployment Guide — Railway + Cloudinary

---

## What you need before starting
1. A **GitHub** account — github.com
2. A **Railway** account — railway.app (sign in with GitHub)
3. A **Cloudinary** account — cloudinary.com (free tier is enough)

---

## STEP 1 — Cloudinary (photo storage)

1. Go to **cloudinary.com** and create a free account
2. From your dashboard, copy three values:
   - **Cloud Name** (top left of dashboard)
   - **API Key**
   - **API Secret**
3. Keep these — you will need them in Step 3

---

## STEP 2 — Push code to GitHub

1. Create a new repository on GitHub (call it `bgs-system`)
2. Upload all project files to the repository
3. Make sure `.env` is in your `.gitignore` (never commit secrets)

Your `.gitignore` should contain:
```
node_modules/
.env
*.log
```

---

## STEP 3 — Deploy on Railway

### 3a. Create a new project
1. Go to **railway.app** and sign in with GitHub
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your `bgs-system` repository
5. Railway will detect it is a Node.js app automatically

### 3b. Add PostgreSQL database
1. In your Railway project, click **+ New**
2. Select **Database → PostgreSQL**
3. Railway creates the database and sets `DATABASE_URL` automatically

### 3c. Set environment variables
1. Click on your **app service** (not the database)
2. Go to **Variables** tab
3. Add these variables one by one:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate at: generate-secret.vercel.app/64 |
| `CLOUDINARY_CLOUD_NAME` | From your Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From your Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
| `APP_URL` | Leave blank for now — fill in after first deploy |

### 3d. Get your URL
1. Go to **Settings** tab of your app service
2. Under **Networking**, click **Generate Domain**
3. Copy your URL (e.g. `https://bgs-system.up.railway.app`)
4. Go back to **Variables** and set `APP_URL` to this URL (no trailing slash)

---

## STEP 4 — Set up the database

1. In Railway, click on your **PostgreSQL** database service
2. Go to the **Query** tab (or use any PostgreSQL client)
3. Copy the entire contents of `db/init.sql`
4. Paste and run it

This creates:
- The `users` table
- The `members` table with indexes
- The ID sequence generator
- A default admin user

---

## STEP 5 — First login

Default credentials (change these immediately):
- **Username:** `hkfaruk`
- **Password:** `Admin@BGS2026`

1. Go to your Railway URL
2. Log in with the above credentials
3. Go to your profile and change the password

---

## STEP 6 — Add your team members

To add more staff who can log in:

Run this SQL in your Railway database query tab:

```sql
-- First install bcrypt to hash a password, or use this pre-hashed version
-- Pre-hashed password is: Staff@BGS2026
INSERT INTO users (name, username, password_hash, role)
VALUES ('Staff Name Here', 'username_here', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMZJaaaSwm.4MxzN7pXSdpjfNW', 'staff');
```

---

## HOW THE QR CODES WORK

When you register a beneficiary:
1. The system generates a QR code automatically
2. The QR code encodes the URL: `https://your-app.railway.app/verify.html?id=BGS-JJA-0001`
3. Anyone who scans the code lands on the **public verification page**
4. The verification page shows: photo, name, district, depot, amount, date
5. **No login required** to view the verification page

### To print a QR card:
1. Open the beneficiary profile
2. Click the **QR Code & Verification** tab
3. Click **Print QR Card**
4. A print-ready card appears — print or save as PDF

---

## BACKING UP YOUR DATA

Railway PostgreSQL includes automatic backups on paid plans.
For the free tier, export regularly:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

## TROUBLESHOOTING

**App won't start:**
- Check that all environment variables are set
- Check Railway logs for errors

**Photos not uploading:**
- Verify Cloudinary credentials in environment variables
- Check file size (max 10MB)

**QR codes not working when scanned:**
- Make sure `APP_URL` is set to your exact Railway URL
- The URL must be live and accessible from the internet

**Database errors:**
- Make sure you ran `db/init.sql` completely
- Check that `DATABASE_URL` is set correctly

---

## SUPPORT

This system was built for the Busoga Ghetto Structure Programme
under the direction of Haji Faruk Kirunda, Special Presidential Assistant.
