# Troll Hair Backend - Lambda Architecture

AWS Lambda functions with API Gateway, DynamoDB, and SES. Deployed via AWS SAM.

## Core Principles

- **Self-contained Lambdas** - Each Lambda has its own dependencies and utilities
- **Filesystem is documentation** - Route structure mirrors API endpoints
- **Single table design** - One DynamoDB table per environment
- **Environment prefixing** - All env vars prefixed with `TROLLHAIR_`

## Directory Structure

```
backend/
├── routes/                        # Lambda handlers (mirrors API routes)
│   ├── contact/
│   │   └── send/                  # POST /contact/send
│   │       ├── index.js           # Lambda handler
│   │       ├── test.js            # Test file
│   │       ├── contact.email.js   # Email template
│   │       ├── package.json       # Lambda dependencies
│   │       └── utilities/         # Lambda-specific utilities
│   └── careers/
│       └── apply/                 # POST /careers/apply
│           ├── index.js
│           ├── test.js
│           ├── application.email.js
│           ├── package.json
│           └── utilities/
├── utilities/                     # Backend-wide dev tooling only
├── template.yaml                  # SAM infrastructure definition
├── samconfig.toml                 # SAM config (dev/prod)
└── package.json                   # devDependencies for local testing
```

## Naming Conventions

### Directory Naming
- **Prefer single words**: `contact/`, `careers/`, `samples/`
- **Multi-word directories**: Use underscores (e.g., `career_opportunities/`)
- **Never use hyphens** in directory names

### Lambda Naming
Pattern: `{environment}-{route-with-hyphens}`

Examples:
- `/contact/send` → `devtrolls-contact-send` or `trollhair-contact-send`
- `/careers/apply` → `devtrolls-careers-apply` or `trollhair-careers-apply`
- `/career_opportunities/apply` → `devtrolls-career_opportunities-apply`

### File Naming
- **Handler**: `index.js` (exports `handler`)
- **Email templates**: `{purpose}.email.js` (exports `createEmailBody(data)`)
- **Tests**: `test.js`

## Lambda Structure

Each Lambda is completely self-contained:

```
routes/{resource}/{action}/
├── index.js           # Lambda handler (main entry point)
├── {name}.email.js    # Email template (if sending emails)
├── package.json       # All dependencies this Lambda needs
├── test.js            # Integration tests
└── utilities/         # Lambda-specific helpers
    ├── honeypot.js    # Spam detection
    ├── html.js        # Template literal helper
    └── test-lambda.js # Test runner helper
```

**Important**: Copy utilities from an existing Lambda when creating new ones. Each Lambda maintains its own copy.

## Handler Pattern

```javascript
// Lambda handler for POST /resource/action
// Brief description of what it does

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createEmailBody } from './resource.email.js'
import { isSpam } from './utilities/honeypot.js'

var dynamoClient = new DynamoDBClient({})
var docClient = DynamoDBDocumentClient.from(dynamoClient)
var sesClient = new SESClient({})

var TABLE_NAME = process.env.TROLLHAIR_TABLE_NAME
var FROM_EMAIL = process.env.TROLLHAIR_FROM_EMAIL
var TO_EMAIL = process.env.TROLLHAIR_TO_EMAIL

export var handler = async function (event) {
  try {
    var data = JSON.parse(event.body)

    // 1. Honeypot spam check
    if (isSpam(data.website, event)) { return respond(400, { error: 'Invalid submission' }) }

    // 2. Validate input
    if (!data.field) { return respond(400, { error: 'Field is required' }) }

    // 3. Prepare and save data
    var email = data.email.trim().toLowerCase()  // Always lowercase emails!
    var item = { pk: 'website#resource', sk: email, /* ... */ }

    // 4. Save to DynamoDB and send email (parallel)
    await Promise.all([
      docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item })),
      sesClient.send(new SendEmailCommand({ /* ... */ }))
    ])

    return respond(200, { message: 'Success', timestamp: Date.now() })

  } catch (error) {
    console.log('Error:', error)
    return respond(500, { error: 'Failed to process request' })
  }
}

function respond (code, message) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  }
}
```

## Data Normalization Rules

### Email Addresses
**Always lowercase before storing.** Emails are case-insensitive, and this ensures:
- Consistent lookups
- No duplicate entries for same email with different casing

```javascript
var email = data.email.trim().toLowerCase()
```

### Text Fields
- Always `trim()` before storing
- Validate max lengths on backend (don't trust frontend)

## DynamoDB Patterns

### Single Table Design
One table per environment: `devtrolls` (dev), `trollhair` (prod)

### Partition Key (pk) / Sort Key (sk) Pattern
```
pk: website#contact              sk: <email>
pk: website#samples#request      sk: <email>
pk: website#careers#application  sk: <email>
```

- `pk` identifies the entity type
- `sk` is typically email (allows one entry per email per entity type)
- Additional fields stored as attributes

## Honeypot Spam Detection

Every form should include a hidden honeypot field:

**Frontend**: Hidden field named `website`
```html
<input type="text" name="website" style="left: -8975px; position: absolute;"
  aria-hidden="true" tabindex="-1" autocomplete="off">
```

**Backend**: Check and reject if filled
```javascript
import { isSpam } from './utilities/honeypot.js'

if (isSpam(data.website, event)) {
  return respond(400, { error: 'Invalid submission' })
}
```

The honeypot utility logs blocked spam attempts with IP, user agent, and submission data.

## Email Templates

Email templates export a `createEmailBody(data)` function:

```javascript
// Pure: generates HTML email body for {purpose}

import html from './utilities/html.js'

export function createEmailBody (data) {
  var baseFont = 'font-family: Arial, sans-serif; font-size: 16px;'
  // ... style variables

  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Email Subject</title>
</head>
<body style="${baseFont}">
  <!-- Email content with inline styles -->
</body>
</html>`
}
```

**Preview emails locally**: `npm run preview-emails` opens http://localhost:3333

## Testing Pattern

Each Lambda has a `test.js` file:

```javascript
// Test for POST /resource/action
// Run with: node routes/resource/action/test.js
// Requires: AWS credentials, TROLLHAIR_* env vars

import testLambda from './utilities/test-lambda.js'
import { handler } from './index.js'

var test = testLambda(handler)
console.log('\n=== Testing /resource/action ===\n')

// Test case: Invalid input
await test('Invalid email', { email: 'bad' }, 400)

// Test case: Honeypot spam
await test('Honeypot spam', { email: 'test@test.com', website: 'spam' }, 400)

// Test case: Valid submission
await test('Valid submission', { /* valid data */ }, 200)

console.log('=== Tests completed ===\n')
```

Run tests:
```bash
npm test                           # All routes
node routes/contact/send/test.js   # Specific route
```

## Environment Variables

All environment variables must be prefixed with `TROLLHAIR_`:

| Variable | Purpose |
|----------|---------|
| `TROLLHAIR_TABLE_NAME` | DynamoDB table name |
| `TROLLHAIR_FROM_EMAIL` | SES sender address |
| `TROLLHAIR_TO_EMAIL` | Recipient for form submissions |

Set locally in `~/.bashrc` or `~/.profile` for testing. SAM sets them in deployed Lambdas via `template.yaml`.

## Adding a New Route

1. Create directory: `routes/{resource}/{action}/`
2. Copy `utilities/` folder from existing Lambda
3. Create `index.js` with handler
4. Create `{name}.email.js` if sending emails
5. Create `package.json` with dependencies
6. Create `test.js` with test cases
7. Add Lambda function to `template.yaml`
8. Run `npm install` in the new directory
9. Test locally: `node routes/{resource}/{action}/test.js`
10. Deploy: `npm run deploy:dev`
