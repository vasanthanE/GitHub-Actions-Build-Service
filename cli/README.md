# Remote Build Service CLI

A CLI tool to build Expo/React Native apps remotely using GitHub Actions - like EAS but self-hosted and unlimited!

## 🚀 Features

- ✅ Build from anywhere (local machine, CI, etc.)
- ✅ Unlimited builds (free GitHub Actions)
- ✅ Automatic APK/AAB generation
- ✅ Uploads to Appwrite Storage
- ✅ Simple CLI interface

## 📋 Prerequisites

1. **GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Save the token securely

2. **Appwrite Setup**
   - Create a storage bucket for builds
   - Get your API key with storage permissions
   - Note your endpoint, project ID, and bucket ID

## 🔧 Installation

### Option 1: Install Globally (Recommended)

```bash
cd cli
npm install -g .
```

Now you can use `build-service` from anywhere!

### Option 2: Use Locally

```bash
cd cli
npm install
npm link
```

## ⚙️ Configuration

Run the configure command to set up your credentials:

```bash
build-service configure \
  --appwrite-endpoint https://cloud.appwrite.io/v1 \
  --appwrite-project YOUR_PROJECT_ID \
  --appwrite-key YOUR_API_KEY \
  --appwrite-bucket YOUR_BUCKET_ID \
  --github-token ghp_YOUR_GITHUB_TOKEN \
  --github-repo owner/repo-name
```

Configuration is saved to `~/.build-service.json`

### View Current Config

```bash
build-service config
```

## 📱 Usage

### Build Your Project

Navigate to your Expo project directory (or specify path):

```bash
# Build from current directory
build-service build

# Build from specific path
build-service build /path/to/my-expo-app

# Build and wait for completion
build-service build --wait
```

### Check Build Status

```bash
build-service status <build-id>
```

Or visit GitHub Actions: `https://github.com/owner/repo/actions`

## 🔄 How It Works

```
┌─────────────┐
│ Your Local  │
│   Machine   │
└──────┬──────┘
       │ 1. Package & Upload
       ▼
┌─────────────┐
│  Appwrite   │
│   Storage   │
└──────┬──────┘
       │ 2. Trigger Build
       ▼
┌─────────────┐
│   GitHub    │
│   Actions   │
└──────┬──────┘
       │ 3. Download, Build
       ▼
┌─────────────┐
│  Appwrite   │
│   Storage   │  ← APK/AAB uploaded here
└─────────────┘
```

1. CLI packages your project (excluding node_modules, native folders)
2. Uploads archive to Appwrite Storage
3. Triggers GitHub Actions via repository_dispatch
4. GitHub Actions downloads, builds, and uploads APK/AAB
5. You download the built APK from Appwrite or GitHub Artifacts

## 🎯 Example Workflow

```bash
# One-time setup
build-service configure \
  --appwrite-endpoint https://cloud.appwrite.io/v1 \
  --appwrite-project 507f1f77bcf86cd799439011 \
  --appwrite-key d1_abc...xyz \
  --appwrite-bucket builds \
  --github-token ghp_abc...xyz \
  --github-repo mycompany/build-service

# Daily usage - just run from your project
cd my-expo-app
build-service build

# Output:
# 📦 Packaging project...
# 📊 Archive size: 2.45 MB
# ☁️  Uploading to Appwrite...
# ✅ Uploaded: 507f1f77bcf86cd799439011
# 🚀 Triggering build...
# ✅ Build started!
# 🔗 Build ID: 1735689600000
# 🔗 GitHub Actions: https://github.com/mycompany/build-service/actions
```

## 📥 Downloading Your APK

### Method 1: Appwrite Storage Dashboard
1. Go to your Appwrite console
2. Navigate to Storage → Your Bucket
3. Find your build (named `build-{buildId}-{timestamp}.apk`)
4. Download

### Method 2: GitHub Actions Artifacts
1. Go to your repo's Actions tab
2. Click on the workflow run
3. Download artifacts at the bottom

### Method 3: Appwrite API (Automated)
```bash
# Get download URL from workflow output
curl "https://cloud.appwrite.io/v1/storage/buckets/BUCKET_ID/files/FILE_ID/download?project=PROJECT_ID"
```

## 🔐 Security Notes

- Configuration file (`~/.build-service.json`) contains sensitive tokens
- Keep your GitHub token and Appwrite API key secure
- Don't commit `.build-service.json` to version control
- Consider using environment variables in production

## 🛠️ Troubleshooting

### "Missing configuration"
Run `build-service configure` with all required options

### "Archive too large"
The CLI excludes `node_modules`, `android`, `ios` folders. If still large:
- Check for large assets in your project
- Consider using `.gitignore` patterns to exclude more files

### Build fails in GitHub Actions
- Check the Actions logs for detailed errors
- Ensure your `app.json`/`app.config.js` is valid
- Verify Expo SDK version is supported

### GitHub token issues
- Token needs `repo` scope
- For private repos, token must have access
- Regenerate token if expired

## 📝 Commands Reference

| Command | Description |
|---------|-------------|
| `build-service configure` | Set up credentials |
| `build-service build [path]` | Build project remotely |
| `build-service build --wait` | Build and wait for completion |
| `build-service status [id]` | Check build status |
| `build-service config` | Show current config |
| `build-service --help` | Show help |

## 🎉 Comparison with EAS

| Feature | EAS | Build Service |
|---------|-----|---------------|
| Free builds/month | 30 | ∞ Unlimited |
| Build from anywhere | ✅ | ✅ |
| CLI tool | ✅ | ✅ |
| Self-hosted | ❌ | ✅ |
| Setup complexity | Easy | Medium |
| Cost (production) | $99/mo | Free |

## 🤝 Contributing

Want to improve the build service? PRs welcome!

## 📄 License

MIT
