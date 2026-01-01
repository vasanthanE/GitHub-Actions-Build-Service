# Quick Setup Guide

## 1. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "Build Service CLI"
4. Select scopes: **`repo`** (all repo permissions)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

## 2. Get Appwrite Credentials

1. Go to your Appwrite console
2. Create a new Storage Bucket (or use existing)
3. Go to Settings → API Keys
4. Create new API key with:
   - Name: "Build Service"
   - Scopes: `files.read`, `files.write`
5. Copy the API Key

## 3. Install CLI

```bash
cd cli
npm install -g .
```

## 4. Configure

```bash
build-service configure \
  --appwrite-endpoint https://cloud.appwrite.io/v1 \
  --appwrite-project YOUR_PROJECT_ID \
  --appwrite-key YOUR_API_KEY \
  --appwrite-bucket YOUR_BUCKET_ID \
  --github-token ghp_YOUR_TOKEN \
  --github-repo YOUR_USERNAME/GitHub-Actions-Build-Service
```

## 5. Test Build

```bash
cd /path/to/your/expo/project
build-service build
```

## 6. Check Results

- **GitHub Actions**: https://github.com/YOUR_USERNAME/GitHub-Actions-Build-Service/actions
- **Appwrite Storage**: Your Appwrite console → Storage → Your Bucket

---

## Troubleshooting

### PowerShell - Line Continuation

If using PowerShell on Windows, use backticks for line continuation:

```powershell
build-service configure `
  --appwrite-endpoint https://cloud.appwrite.io/v1 `
  --appwrite-project YOUR_PROJECT_ID `
  --appwrite-key YOUR_API_KEY `
  --appwrite-bucket YOUR_BUCKET_ID `
  --github-token ghp_YOUR_TOKEN `
  --github-repo YOUR_USERNAME/GitHub-Actions-Build-Service
```

### Enable repository_dispatch

Make sure your GitHub repo has Actions enabled:
1. Go to repo Settings → Actions → General
2. Allow "All actions and reusable workflows"

### First Build Takes Longer

The first build will:
- Download dependencies
- Set up Android SDK
- Takes ~5-10 minutes

Subsequent builds are faster with caching!
