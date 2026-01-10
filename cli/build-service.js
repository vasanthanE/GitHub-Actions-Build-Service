#!/usr/bin/env node

const { program } = require('commander');
const { Client, Storage, ID } = require('node-appwrite');
const { InputFile } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const axios = require('axios');
const os = require('os');

// Configuration
let config = {};
const CONFIG_PATH = path.join(os.homedir(), '.build-service.json');

// Load configuration
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
}

// Save configuration
function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Configure command
program
  .command('configure')
  .description('Configure the build service credentials')
  .option('--appwrite-endpoint <url>', 'Appwrite endpoint URL')
  .option('--appwrite-project <id>', 'Appwrite project ID')
  .option('--appwrite-key <key>', 'Appwrite API key')
  .option('--appwrite-bucket <id>', 'Appwrite storage bucket ID')
  .option('--github-token <token>', 'GitHub personal access token')
  .option('--github-repo <repo>', 'GitHub repository (owner/repo)')
  .action((options) => {
    loadConfig();

    if (options.appwriteEndpoint) config.appwriteEndpoint = options.appwriteEndpoint;
    if (options.appwriteProject) config.appwriteProject = options.appwriteProject;
    if (options.appwriteKey) config.appwriteKey = options.appwriteKey;
    if (options.appwriteBucket) config.appwriteBucket = options.appwriteBucket;
    if (options.githubToken) config.githubToken = options.githubToken;
    if (options.githubRepo) config.githubRepo = options.githubRepo;

    saveConfig();
    console.log('✅ Configuration saved to', CONFIG_PATH);
  });

// Build command
program
  .command('build')
  .description('Build your Expo project remotely')
  .argument('[project-path]', 'Path to your Expo project', '.')
  .option('-p, --platform <platform>', 'Platform to build (android, ios, all)', 'android')
  .option('-v, --variant <variant>', 'Build variant (development, preview, release)', 'release')
  .option('--wait', 'Wait for build to complete', false)
  .action(async (projectPath, options) => {
    try {
      loadConfig();

      // Validate configuration
      if (!config.appwriteEndpoint || !config.appwriteProject || !config.appwriteKey ||
        !config.appwriteBucket || !config.githubToken || !config.githubRepo) {
        console.error('❌ Missing configuration. Run: build-service configure --help');
        process.exit(1);
      }

      console.log('📦 Packaging project...');

      // Create temporary archive
      const buildId = Date.now().toString();
      const tempDir = path.join(os.tmpdir(), `build-service-${buildId}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const archivePath = path.join(tempDir, 'project.tar.gz');

      // Get all directories/files to include (exclude node_modules, .git, etc.)
      const entries = fs.readdirSync(projectPath, { withFileTypes: true })
        .filter(entry => {
          const exclude = ['node_modules', '.git', '.expo', 'android', 'ios', '.gradle', 'test.tar.gz', 'test2.tar.gz'];
          return !exclude.includes(entry.name);
        })
        .map(entry => entry.name);

      console.log(`📁 Including: ${entries.join(', ')}`);

      // Create tar.gz of project
      await tar.create(
        {
          gzip: true,
          file: archivePath,
          cwd: projectPath,
          portable: true
        },
        entries
      );

      const stats = fs.statSync(archivePath);
      console.log(`📊 Archive size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Upload to Appwrite
      console.log('☁️  Uploading to Appwrite...');
      const client = new Client()
        .setEndpoint(config.appwriteEndpoint)
        .setProject(config.appwriteProject)
        .setKey(config.appwriteKey);

      const storage = new Storage(client);

      const file = await storage.createFile(
        config.appwriteBucket,
        ID.unique(),
        InputFile.fromPath(archivePath, 'project.tar.gz')
      );

      console.log('✅ Uploaded:', file.$id);

      // Generate download URL
      const sourceUrl = `${config.appwriteEndpoint}/storage/buckets/${config.appwriteBucket}/files/${file.$id}/download?project=${config.appwriteProject}`;

      // Trigger GitHub Actions
      console.log('🚀 Triggering build...');
      const [owner, repo] = config.githubRepo.split('/');

      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/dispatches`,
        {
          event_type: 'remote-build',
          client_payload: {
            source_url: sourceUrl,
            build_id: buildId,
            platform: options.platform,
            variant: options.variant || 'release'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      console.log('\n✅ Build started!');
      console.log(`🔗 Build ID: ${buildId}`);
      console.log(`🔗 GitHub Actions: https://github.com/${config.githubRepo}/actions`);

      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });

      if (options.wait) {
        console.log('\n⏳ Waiting for build to complete...');
        console.log('(This feature requires webhook setup - check GitHub Actions manually for now)');
      }

    } catch (error) {
      console.error('❌ Build failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check build status')
  .argument('[build-id]', 'Build ID to check')
  .action((buildId) => {
    loadConfig();
    console.log(`🔍 Checking status for build: ${buildId || 'latest'}`);
    console.log(`🔗 View at: https://github.com/${config.githubRepo}/actions`);
  });

// Config show command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    loadConfig();
    console.log('\n📋 Current Configuration:');
    console.log(JSON.stringify({
      ...config,
      appwriteKey: config.appwriteKey ? '***' + config.appwriteKey.slice(-4) : undefined,
      githubToken: config.githubToken ? '***' + config.githubToken.slice(-4) : undefined,
    }, null, 2));
  });

program
  .name('build-service')
  .description('CLI tool for remote Expo builds using GitHub Actions')
  .version('1.0.0');

program.parse();
