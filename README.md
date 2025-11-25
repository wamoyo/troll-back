# Troll Hair Website - Backend

AWS Lambda + API Gateway + DynamoDB + SES. Deployed via AWS SAM.

## Quick Start

```bash
# Install root devDependencies
npm install

# Install Lambda dependencies
cd routes/contact/send && npm install && cd ../../..
cd routes/careers/apply && npm install && cd ../../..

# Set environment variables (add to ~/.bashrc)
export TROLLHAIR_TABLE_NAME=devtrolls
export TROLLHAIR_FROM_EMAIL=website@trollhair.com
export TROLLHAIR_TO_EMAIL=website@trollhair.com

# Test
npm test

# Deploy
npm run deploy:dev
```

## API Endpoints

### Development
- **Base URL**: `https://dev.trollhair.com`
- **Direct URL**: `https://ea147pg5f3.execute-api.us-east-1.amazonaws.com/dev`

### Production
- **Base URL**: `https://backend.trollhair.com` *(not yet deployed)*

### Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/contact/send` | Contact form submission |
| POST | `/careers/apply` | Job application submission |

## Environments

| Environment | Table | CORS Origin | Lambda Prefix |
|-------------|-------|-------------|---------------|
| Development | `devtrolls` | `http://localhost:8700` | `devtrolls-` |
| Production | `trollhair` | `https://trollhair.com` | `trollhair-` |

## Directory Structure

```
backend/
├── routes/
│   ├── contact/send/      # POST /contact/send
│   └── careers/apply/     # POST /careers/apply
├── utilities/             # Backend-wide dev tooling
├── template.yaml          # SAM infrastructure
├── samconfig.toml         # SAM config (dev/prod)
└── package.json           # Scripts + devDependencies
```

## Scripts

```bash
npm test              # Run all route tests
npm run preview-emails # Preview email templates at localhost:3333
npm run build         # SAM build
npm run deploy:dev    # Build + deploy to dev
npm run deploy:prod   # Build + deploy to prod
```

## Testing

```bash
# All routes
npm test

# Specific route
node routes/contact/send/test.js
node routes/careers/apply/test.js
```

## Email Preview

```bash
npm run preview-emails
# Opens http://localhost:3333 with live reload
# Auto-discovers all *.email.js files
```

## Prerequisites

- Node.js (latest)
- AWS CLI (configured)
- AWS SAM CLI
