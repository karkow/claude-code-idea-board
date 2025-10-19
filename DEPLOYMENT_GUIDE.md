# Deployment Guide - OAuth Configuration

## Problem
After deploying to Vercel, Google OAuth redirects to `localhost:3000` instead of your production URL.

## Solution

Follow these steps **in order**:

### 1. Get Your Vercel URL

After deploying to Vercel, you'll get a URL like:
```
https://your-app-name.vercel.app
```

Or if you have a custom domain:
```
https://yourdomain.com
```

### 2. Update Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following fields:

   **Site URL:**
   ```
   https://your-app-name.vercel.app
   ```

   **Redirect URLs** (add these lines):
   ```
   https://your-app-name.vercel.app/auth/callback
   https://your-app-name.vercel.app
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```

5. Click **Save**

### 3. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (the one you used for OAuth)
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID**
5. Under **Authorized JavaScript origins**, ensure you have:
   ```
   https://your-app-name.vercel.app
   http://localhost:3000
   ```

6. Under **Authorized redirect URIs**, add:
   ```
   https://xosvozisaejmomilnkep.supabase.co/auth/v1/callback
   https://your-app-name.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

7. Click **Save**

   **Note:** Replace `xosvozisaejmomilnkep.supabase.co` with your actual Supabase project URL

### 4. Wait for Vercel Deployment

After pushing the code fix, Vercel will automatically redeploy. Wait for the deployment to complete (~1-2 minutes).

### 5. Test the OAuth Flow

1. Go to your Vercel URL: `https://your-app-name.vercel.app`
2. Click "Sign in with Google"
3. Complete the Google authentication
4. You should be redirected back to your Vercel URL (not localhost!)

## Troubleshooting

### Still Redirecting to Localhost?

**Clear your browser cache:**
```
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
```

**Check Supabase Site URL:**
- Make sure it's set to your production URL, not localhost

**Check Google Cloud Console:**
- Verify all redirect URIs are correct
- Make sure there are no typos

### Getting "redirect_uri_mismatch" Error?

This means the redirect URI in your request doesn't match what's configured in Google Cloud Console.

**Fix:**
1. Copy the **exact** redirect URI from the error message
2. Add it to Google Cloud Console under Authorized redirect URIs
3. Save and try again

### OAuth Works Locally but Not in Production?

**Check environment variables in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set correctly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy after adding/updating variables

## URLs Reference

For easy copy-paste, here are the URLs you need (replace with your actual values):

**Your Vercel URL:**
```
https://your-app-name.vercel.app
```

**Your Supabase Project URL:**
```
https://xosvozisaejmomilnkep.supabase.co
```

**Required Redirect URIs:**
```
https://xosvozisaejmomilnkep.supabase.co/auth/v1/callback
https://your-app-name.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

## How OAuth Flow Works

1. User clicks "Sign in with Google"
2. Redirected to Google login page
3. User authenticates with Google
4. Google redirects to Supabase: `https://[your-project].supabase.co/auth/v1/callback`
5. Supabase processes the OAuth response
6. Supabase redirects to your app: `https://your-app.vercel.app/auth/callback`
7. Your callback route extracts the session tokens
8. User is redirected to the home page
9. AuthContext detects the session and shows the Whiteboard

## Need Help?

If you're still having issues:

1. Check the browser console for errors (F12 → Console)
2. Check Supabase logs (Dashboard → Logs)
3. Verify all URLs match exactly (no trailing slashes unless specified)
4. Try signing in with an incognito window to rule out cache issues
