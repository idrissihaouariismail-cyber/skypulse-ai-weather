# Vercel Deployment Guide for SkyPulse AI Weather

## ✅ Project Preparation Complete

The project has been prepared for Vercel deployment with the following configurations:

### 1. Build Configuration
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Base path: `/` (configured in `vite.config.ts`)

### 2. Vercel Configuration
- ✅ `vercel.json` created with proper settings
- ✅ SPA routing configured (all routes redirect to index.html)

### 3. Environment Variables
All environment variables use the `VITE_` prefix, which is safe for frontend usage:
- `VITE_OPENWEATHER_API_KEY` - OpenWeatherMap API key
- `VITE_FIREBASE_API_KEY` - Firebase API key (if used)
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID
- `VITE_IQAIR_API_KEY` - IQAir API key (if used)
- `VITE_MAPBOX_TOKEN` - Mapbox token (if used)

### 4. Git Configuration
- ✅ `.gitignore` updated to exclude `.env` files
- ✅ Environment files will not be committed to GitHub

---

## 📋 Vercel Deployment Settings

### Step 1: Connect Your Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository

### Step 2: Configure Project Settings

**Framework Preset:** Vite (or Other)

**Build and Output Settings:**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` (default)

**Root Directory:** `./` (leave as default)

### Step 3: Environment Variables

Add the following environment variables in Vercel Dashboard:

**Required:**
```
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Optional (if using Firebase):**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Optional (if using other services):**
```
VITE_IQAIR_API_KEY=your_iqair_key
VITE_MAPBOX_TOKEN=your_mapbox_token
```

**How to add:**
1. In Vercel project settings, go to **"Environment Variables"**
2. Click **"Add New"**
3. Enter variable name and value
4. Select environments: **Production**, **Preview**, and **Development**
5. Click **"Save"**

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Deploy to production

---

## 🚀 Pushing to GitHub

### If you don't have a GitHub repository yet:

1. **Create a new repository on GitHub:**
   ```bash
   # Go to github.com and create a new repository
   # Don't initialize with README, .gitignore, or license
   ```

2. **Initialize git and push (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SkyPulse AI Weather app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### If you already have a GitHub repository:

```bash
# Add all changes
git add .

# Commit changes
git commit -m "Prepare project for Vercel deployment"

# Push to GitHub
git push origin main
```

### Verify .env files are ignored:

```bash
# Check that .env files are not tracked
git status

# If .env files appear, remove them from tracking:
git rm --cached .env .env.local .env.*.local
git commit -m "Remove environment files from tracking"
```

---

## 🔍 Post-Deployment Checklist

After deployment, verify:

- [ ] App loads correctly at your Vercel URL
- [ ] Weather data fetches successfully (check browser console)
- [ ] Location detection works (if enabled)
- [ ] All routes work (Dashboard, Forecast, Radar, Settings, etc.)
- [ ] Language switching works
- [ ] No console errors in browser DevTools

---

## 🐛 Troubleshooting

### Build fails:
- Check that all environment variables are set in Vercel
- Verify `package.json` has correct build script
- Check Vercel build logs for specific errors

### App loads but API calls fail:
- Verify environment variables are set correctly in Vercel
- Check that API keys are valid
- Ensure CORS is enabled for your APIs (if required)

### Routes return 404:
- Verify `vercel.json` has the rewrite rule for SPA routing
- Check that `base: '/'` is set in `vite.config.ts`

### Environment variables not working:
- Ensure variables start with `VITE_` prefix
- Rebuild after adding new environment variables
- Check Vercel environment variable settings (Production/Preview/Development)

---

## 📝 Notes

- The project uses relative imports (`./src/`, `../src/`) which work correctly in production builds
- All environment variables are exposed to the client (they use `VITE_` prefix)
- The build output is in the `dist` folder
- SPA routing is handled by Vercel's rewrite rules in `vercel.json`

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

