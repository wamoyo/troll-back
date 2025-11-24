# Troll Hair Website - Backend

Backend built with AWS Lambda (Node.js latest), API Gateway, DynamoDB, and SES. Managed and deployed via AWS SAM.

## API Endpoints

**Development:**
- Custom Domain: `https://dev.trollhair.com`
- Direct URL: `https://ea147pg5f3.execute-api.us-east-1.amazonaws.com/dev`
- Example: `POST https://dev.trollhair.com/contact/send`

**Production:** *(not yet deployed)*
- Custom Domain: TBD
- Example: `POST <domain>/contact/send`

## Architecture

**Tech Stack:**
- AWS Lambda (Node.js latest) - Serverless compute
- API Gateway - HTTP endpoints with CORS
- DynamoDB - Single table for all data (single-table design)
- SES - Email sending (website@trollhair.com)
- AWS SAM - Infrastructure as code + deployment

**Two Environments:**
- `devtrolls` - Development (CORS: http://localhost:8700)
- `trollhair` - Production (CORS: https://trollhair.com)

Each environment has separate Lambda functions, API Gateway, DynamoDB table, and IAM permissions.

## Directory Structure

```
backend/
├── routes/                        # Lambda handlers (mirrors API routes)
│   └── contact/
│       └── send/                  # POST /contact/send
│           ├── index.js           # Lambda handler
│           ├── test.js            # Test file
│           ├── contact.email.js   # Email template
│           ├── package.json       # Lambda dependencies
│           ├── node_modules/      # Installed per-Lambda
│           └── utilities/         # Lambda-specific utilities
│               ├── honeypot.js    # Spam detection
│               ├── html.js        # Template helper
│               └── test-lambda.js # Test helper
├── utilities/
│   └── preview-server.js          # Backend-wide dev tooling
├── template.yaml                  # SAM infrastructure definition
├── samconfig.toml                 # SAM config (dev/prod)
├── package.json                   # devDependencies + scripts
└── README.md
```

**Conventions:**
- Routes mirror API structure - filesystem IS the API documentation
- Directory naming: Single-word preferred; multi-word use underscores (e.g., `career_opportunities/`)
- Lambda naming: `{env}-{route-with-hyphens}` (e.g., `devtrolls-contact-send`)
- Each Lambda is self-contained:
  - Own `package.json` with all dependencies
  - Own `utilities/` folder with Lambda-specific code (honeypot, html, test helpers)
  - Copy utilities from existing Lambda when creating new ones
- Root `package.json` has `devDependencies` for local testing/tooling
- Root `utilities/` only for backend-wide dev tooling (e.g., preview-server)
- Email templates: `*.email.js` files export `createEmailBody(data)` function
- Preview emails: `npm run preview-emails` (auto-discovers all `*.email.js` files)

## DynamoDB Single Table Design

One table per environment: `devtrolls` (dev), `trollhair` (prod)

Single-table design with pk/sk pattern (email as sort key for common access pattern):
```
pk: website#contact, sk: <email>
pk: website#sample, sk: <email>
pk: website#career, sk: <email>
```

Includes GSI with flipped pk/sk for querying all items by email across entity types.

## Development Workflow

**Prerequisites:** Node.js, AWS CLI, AWS SAM CLI

**Setup:**
```bash
# Install root devDependencies (for local testing)
npm install

# Install Lambda dependencies
cd routes/contact/send && npm install && cd ../../..

# Add to ~/.profile or ~/.bashrc for local testing
# All env vars must be prefixed with TROLLHAIR_
export TROLLHAIR_TABLE_NAME=devtrolls
export TROLLHAIR_FROM_EMAIL=website@trollhair.com
export TROLLHAIR_TO_EMAIL=website@trollhair.com
```

**Testing:**
```bash
npm test                              # All routes
node routes/contact/send/test.js      # Specific route
```

**Email Preview:**
```bash
npm run preview-emails
# Opens http://localhost:3333 with live reload
```

**Deployment:**
```bash
npm run deploy:dev    # Deploy to dev
npm run deploy:prod   # Deploy to prod
```

## Package Scripts

```json
{
  "scripts": {
    "test": "find routes -name 'test.js' -type f -not -path '*/node_modules/*' | xargs -I {} node {}",
    "preview-emails": "node utilities/preview-server.js",
    "build": "sam build",
    "deploy:dev": "sam build && sam deploy --config-env dev",
    "deploy:prod": "sam build && sam deploy --config-env prod"
  }
}
```
