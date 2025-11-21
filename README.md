# Troll Hair Website - Backend

Backend built with AWS Lambda (Node.js), API Gateway, DynamoDB, and SES. Managed and deployed via AWS SAM.

## Architecture

**Tech Stack:**
- AWS Lambda (Node.js) - Serverless compute
- API Gateway - HTTP endpoints
- DynamoDB - Single table for all data (single-table design)
- SES - Email sending
- AWS SAM - Infrastructure as code + deployment

**Two Environments:**
- `devtrolls-*` - Development environment (dev.trollhair.com)
- `trollhair-*` - Production environment (backend.trollhair.com)

Each environment has completely separate Lambda functions, API Gateway, DynamoDB table, and IAM permissions. Same code, deployed twice. Isolated resources.

## Directory Structure

```
backend/
├── node_modules/                  # SAM bundles dependencies per-lambda from here
├── routes/                        # Lambda handlers (mirrors API routes)
│   ├── contact/
│   │   └── send/                  # POST /contact/send
│   │       ├── index.js           # Lambda handler
│   │       └── test.js            # Test file
│   ├── samples/
│   │   └── request/               # POST /samples/request
│   │       ├── index.js
│   │       └── test.js
│   └── careers/
│       ├── post/                  # POST /careers/post (future)
│       │   ├── index.js
│       │   └── test.js
│       └── apply/                 # POST /careers/apply
│           ├── index.js
│           └── test.js
├── template.yaml                  # SAM template (infrastructure definition)
├── samconfig.toml                 # SAM CLI configuration (dev/prod)
├── package.json                   # Dependencies and npm scripts
└── README.md
```

**Principles:**
- `routes/` mirrors API routes - filesystem IS the API documentation
- Each endpoint is a folder containing `index.js` (AWS Lambda convention) and `test.js`
- Use `tests/` folder instead of `test.js` if multiple test files needed
- No `lib/` directory - each Lambda is self-contained, using AWS SDK directly
- Extract shared code only if real duplication emerges

## DynamoDB Single Table Design

One table per environment: `devtrolls` (dev), `trollhair` (prod)

Data organized by partition key (pk) and sort key (sk), using hashtags for query filtering:
```
pk: contact#timestamp, sk: email, ...contact data
pk: sample-request#timestamp, sk: email, ...sample request data
pk: careers#application, sk: email, ...career application data
```

## Development Workflow

**Prerequisites:** Node.js, AWS CLI, AWS SAM CLI

**Setup:**
```bash
cd backend
npm install
```

**Testing:**
```bash
# Test specific route
node routes/contact/send/test.js

# Test all routes
npm test

# Test all routes in a category
for test in routes/careers/*/test.js; do node "$test"; done
```

**Deployment:**
```bash
npm run deploy:dev   # Deploy to dev environment
npm run deploy:prod  # Deploy to production

# First time only: sam deploy --guided
```

## Frontend Integration

Frontend detects environment and uses appropriate backend:
- `localhost` → `https://dev.trollhair.com`
- `trollhair.com` → `https://backend.trollhair.com`

No environment variables needed in frontend. Simple hostname detection.

## Package Scripts

```json
{
  "scripts": {
    "test": "find routes -name 'test.js' -type f | xargs -I {} node {}",
    "build": "sam build",
    "deploy:dev": "sam build && sam deploy --config-env dev",
    "deploy:prod": "sam build && sam deploy --config-env prod",
    "validate": "sam validate"
  }
}
```
