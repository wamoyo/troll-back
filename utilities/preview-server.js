// Email template preview server
// Auto-discovers *.email.js files, serves with live reload
// Run with: npm run preview-emails

import { createServer } from 'http'
import { readdir } from 'fs/promises'
import { watch } from 'fs'
import { join, relative } from 'path'
import { pathToFileURL } from 'url'

var PORT = 3333
var clients = []

// Auto-discover all *.email.js files
async function discoverEmailTemplates () {
  var templates = []

  async function scan (dir) {
    var entries = await readdir(dir, { withFileTypes: true })

    for (var entry of entries) {
      var fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        await scan(fullPath)
      } else if (entry.name.endsWith('.email.js')) {
        // Use route path as URL: routes/contact/send/contact.email.js -> contact/send
        var routePath = relative('routes', fullPath)
          .replace('.email.js', '')
          .replace(/\\/g, '/') // Windows path fix

        templates.push({
          path: fullPath,
          name: entry.name,
          routePath: routePath,
          url: routePath
        })
      }
    }
  }

  await scan('routes')
  return templates
}

// Create Proxy that returns ${propertyName} for any property
function createPlaceholderData () {
  return new Proxy({}, {
    get (target, prop) {
      if (prop === 'then') return undefined // For await compatibility
      return `\${${String(prop)}}`
    }
  })
}

// Render email template with placeholder data
async function renderTemplate (templatePath) {
  try {
    // Clear module cache and import fresh
    var fileUrl = pathToFileURL(join(process.cwd(), templatePath)).href
    var cacheBusted = `${fileUrl}?t=${Date.now()}`
    var module = await import(cacheBusted)

    var createEmailBody = module.createEmailBody || module.default
    if (!createEmailBody) {
      throw new Error('No createEmailBody export found')
    }

    var placeholderData = createPlaceholderData()
    var html = createEmailBody(placeholderData)

    return html
  } catch (error) {
    return `
      <html>
        <body style="font-family: monospace; padding: 2rem;">
          <h1>Error rendering template</h1>
          <pre>${error.stack}</pre>
        </body>
      </html>
    `
  }
}

// Homepage - list all templates
function renderHomepage (templates) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Template Preview</title>
      <style>
        body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; }
        h1 { border-bottom: 2px solid #000; padding-bottom: 1rem; }
        ul { list-style: none; padding: 0; }
        li { margin: 0.5rem 0; }
        a { color: #0066cc; text-decoration: none; font-size: 1.1rem; }
        a:hover { text-decoration: underline; }
        .path { color: #666; font-size: 0.9rem; margin-left: 0.5rem; }
      </style>
    </head>
    <body>
      <h1>Email Templates (${templates.length})</h1>
      <ul>
        ${templates.map(t => `
          <li>
            <a href="/${t.url}">/${t.url}</a>
            <span class="path">${relative(process.cwd(), t.path)}</span>
          </li>
        `).join('')}
      </ul>
      <script>
        // Live reload via SSE
        var eventSource = new EventSource('/sse')
        eventSource.onmessage = () => location.reload()
      </script>
    </body>
    </html>
  `
}

// SSE endpoint for live reload
function handleSSE (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  clients.push(res)

  req.on('close', () => {
    clients = clients.filter(client => client !== res)
  })
}

// Notify all clients to reload
function notifyClients () {
  clients.forEach(client => {
    client.write('data: reload\n\n')
  })
}

// Start server
async function start () {
  var templates = await discoverEmailTemplates()

  console.log(`\n📧 Email Preview Server`)
  console.log(`   Found ${templates.length} template(s)\n`)

  var server = createServer(async (req, res) => {
    var url = req.url

    // SSE endpoint
    if (url === '/sse') {
      return handleSSE(req, res)
    }

    // Homepage
    if (url === '/' || url === '') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(renderHomepage(templates))
      return
    }

    // Template preview
    var templateUrl = url.slice(1)
    var template = templates.find(t => t.url === templateUrl)

    if (template) {
      var html = await renderTemplate(template.path)

      // Inject live reload script
      var withLiveReload = html.replace(
        '</body>',
        `<script>
          var eventSource = new EventSource('/sse')
          eventSource.onmessage = () => location.reload()
        </script></body>`
      )

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(withLiveReload)
      return
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Template not found')
  })

  server.listen(PORT, () => {
    console.log(`   🌐 http://localhost:${PORT}\n`)
  })

  // Watch for changes
  watch('routes', { recursive: true }, (event, filename) => {
    if (filename && filename.endsWith('.email.js')) {
      console.log(`   🔄 ${filename} changed, reloading...`)
      notifyClients()
    }
  })
}

start().catch(console.error)
