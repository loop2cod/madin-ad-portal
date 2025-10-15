# AD Portal - Cloudflare Workers Deployment

This guide explains how to deploy the AD Portal to Cloudflare Workers using Wrangler.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Workers/Pages enabled
2. **Node.js**: Ensure you have Node.js 18+ installed
3. **Wrangler CLI**: Installed as a dev dependency in this project

## Setup and Authentication

### 1. Install Dependencies
```bash
npm install
```

### 2. Wrangler Authentication Commands

#### Login to Wrangler
```bash
# Using npm script (recommended)
npm run wrangler:login

# Or directly
npx wrangler auth login
```
This will open your browser to authenticate with Cloudflare.

#### Check Current User
```bash
# Using npm script
npm run wrangler:whoami

# Or directly
npx wrangler auth whoami
```

#### Logout from Wrangler
```bash
# Using npm script
npm run wrangler:logout

# Or directly
npx wrangler auth logout
```

## Deployment Commands

### 1. Build for Workers
```bash
npm run build:workers
```
This command:
- Runs `next build` to build the Next.js application
- Runs `@opennextjs/cloudflare` to convert the build for Cloudflare Workers

### 2. Deploy to Development/Default Environment
```bash
npm run deploy
```

### 3. Deploy to Staging Environment
```bash
npm run deploy:staging
```

### 4. Deploy to Production Environment
```bash
npm run deploy:production
```

## Configuration

### Environment Variables

Update the `wrangler.toml` file to add your environment variables:

```toml
[vars]
NODE_ENV = "production"
NEXT_PUBLIC_API_URL = "https://your-api-domain.com"
# Add other environment variables as needed
```

### Custom Domains

After deployment, you can configure custom domains in the `wrangler.toml`:

```toml
[env.production]
routes = [
  { pattern = "yourdomain.com/*", custom_domain = true }
]
```

## Project Structure for Workers

The build process creates:
- `.vercel/output/static/` - Static assets for Cloudflare Pages
- Worker-compatible build using `@opennextjs/cloudflare`

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```bash
   npm run wrangler:logout
   npm run wrangler:login
   ```

2. **Build Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check Node.js version (18+ required)
   - Clear build cache: `rm -rf .next .vercel`

3. **Deployment Errors**
   - Check your Cloudflare account has Workers/Pages enabled
   - Verify you have the necessary permissions
   - Check the project name in `wrangler.toml` is unique

### Useful Wrangler Commands

```bash
# View all Pages projects
npx wrangler pages project list

# View deployment status
npx wrangler pages deployment list

# Delete a deployment
npx wrangler pages deployment delete [DEPLOYMENT_ID]

# View logs
npx wrangler pages deployment tail

# Test locally with Workers environment
npx wrangler pages dev .vercel/output/static
```

## Next Steps

1. Configure environment variables in Cloudflare dashboard
2. Set up custom domains
3. Configure analytics and monitoring
4. Set up CI/CD pipeline for automatic deployments

## Support

For Cloudflare Workers/Pages specific issues, refer to:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [OpenNext Cloudflare Documentation](https://github.com/opennextjs/opennextjs-cloudflare)