# CodeGuard AI 🛡️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/yourusername/codeguard-ai/pulls)

> **We didn't just build an AI model—we built a CI-integrated DevOps agent that actively prevents bad code from reaching production.**

## 🎯 What is CodeGuard AI?

CodeGuard AI is a **production-ready DevOps agent** that analyzes code changes before deployment and prevents production failures. It's not just an AI model—it's a complete deployment gating system with a web interface, REST API, and CI/CD integration capabilities.

### The Problem We Solve

Every day, teams deploy code that breaks production. CodeGuard AI acts as your last line of defense, analyzing git diffs in real-time to catch:
- 🔒 Security vulnerabilities before they reach production
- 🐛 Logic errors that would cause runtime failures
- ⚡ Performance bottlenecks that would slow your system
- 🧩 Complexity issues that make code unmaintainable

## ✨ Key Features

### Core Analysis Engine
- **Git Diff Analysis** - Deep inspection of code changes with AST parsing
- **Risk Scoring Engine** - 0-100 risk assessment with intelligent weighting
- **CI/CD Deployment Gating** - Automatic approve/block/review decisions
- **Failure Prediction** - AI-powered prediction of potential runtime failures
- **Observability Insights** - Detailed logging and analysis reports

### 🌐 Dual Web UI & API
- **Two Modern UIs** - Choose between Vanilla JS or React with Framer Motion
- **React Dashboard** - Modern UI with shadcn/ui components and smooth animations
- **PR Comment Simulator** - GitHub-inspired interface for analyzing pull requests
- **REST API** - Production-ready endpoints with comprehensive validation
- **File Upload Support** - Drag-and-drop or paste diffs directly
- **Real-time Analysis** - Instant feedback on code changes
- **GitHub-like Reports** - Professional analysis reports with severity badges

### 🔒 Production-Ready Security
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Comprehensive request validation and sanitization
- **Helmet.js Integration** - Security headers and CSP policies
- **CORS Protection** - Configurable cross-origin resource sharing
- **Error Handling** - Graceful error handling with detailed logging

### 📊 Multiple Deployment Options
- **CLI Mode** - Command-line interface for local development
- **Web Server** - Express-based web application
- **Docker Support** - Containerized deployment (coming soon)
- **Heroku Ready** - One-click deployment to Heroku
- **CI/CD Integration** - GitHub Actions, GitLab CI, Jenkins support

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codeguard-ai.git
cd codeguard-ai

# Install dependencies
npm install

# Create log directories
npm run prepare
```

### Usage Options

#### 1. CLI Mode (Local Analysis)

```bash
# Generate a diff from your changes
git diff origin/main...HEAD > changes.diff

# Run CodeGuard AI analysis
npm start changes.diff

# Or use the analyze script
npm run analyze changes.diff
```

#### 2. Web UI Mode (Interactive)

CodeGuard AI now offers **two modern user interfaces**:

**Vanilla JS UI** (Original):
```bash
# Start the web server
npm run web

# Or start in development mode with auto-reload
npm run dev
```

Then open your browser to **http://localhost:3000**

**React UI** (New - Modern Dashboard):
```bash
# Build the React frontend (first time only)
npm run frontend:build

# Start the web server
npm run web
```

Then open your browser to **http://localhost:3000/react**

The React UI features:
- 🎨 Modern design with Framer Motion animations
- ✨ shadcn/ui components with Tailwind CSS
- 🌙 Beautiful dark theme with purple accents
- 📊 Enhanced visualizations and metrics
- 🚀 Lightning-fast performance with Vite

**Development Mode** (Both UIs):
```bash
# Run both backend and React dev server simultaneously
npm run dev:all

# Or run them separately:
npm run dev              # Backend with auto-reload
npm run frontend:dev     # React dev server (port 5173)
```

#### 3. API Mode (Programmatic)

```bash
# Start the server
npm run web

# Make API requests
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"diff": "diff --git a/file.js..."}'
```

## 🌐 Web Interface

### Accessing the Web UI

1. **Start the server:**
   ```bash
   npm run web
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Analyze code changes:**
   - **Paste** git diff output directly into the textarea
   - **Upload** a .diff or .patch file (drag-and-drop supported)
   - **Load Sample** to test with a pre-configured example

### Web UI Features

- 📝 **Large Textarea** - Paste diffs up to 50MB
- 📁 **File Upload** - Drag-and-drop or click to browse
- 🎨 **GitHub-like UI** - Familiar interface for developers
- 📊 **Risk Assessment** - Color-coded risk scores (0-100)
- 🔍 **Detailed Findings** - Security, complexity, and performance issues
- 📋 **Copy Results** - One-click copy to clipboard in markdown format
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop
- ♿ **Accessible** - Full keyboard navigation and screen reader support

### Screenshot

```
┌─────────────────────────────────────────────────────────┐
│  🛡️ CodeGuard AI - PR Comment Simulator                │
├─────────────────────────────────────────────────────────┤
│  Analyze your pull request diffs before deployment      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Paste your git diff here...                    │    │
│  │                                                 │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [Choose File] [Load Sample] [Analyze PR]              │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 📊 Risk Assessment                              │    │
│  │ Risk Score: 75/100 (HIGH)                       │    │
│  │                                                  │    │
│  │ 🔒 Security Issues (3)                          │    │
│  │ 🧩 Complexity Issues (2)                        │    │
│  │ ⚡ Performance Concerns (1)                     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🔌 API Documentation

### Endpoints

#### POST /api/analyze
Analyze a git diff and return risk assessment.

**Request:**
```json
{
  "diff": "diff --git a/src/app.js b/src/app.js\nindex 1234567..abcdefg 100644\n--- a/src/app.js\n+++ b/src/app.js\n@@ -10,7 +10,7 @@\n-const oldCode = 'old';\n+const newCode = 'new';"
}
```

**Response:**
```json
{
  "riskScore": 75,
  "riskLevel": "HIGH",
  "summary": "This PR introduces several security concerns and complexity issues that should be addressed before deployment.",
  "filesAnalyzed": 3,
  "totalFindings": 6,
  "security": [
    {
      "severity": "high",
      "message": "Potential SQL injection vulnerability",
      "file": "src/database.js",
      "description": "User input is directly concatenated into SQL query. Use parameterized queries instead."
    }
  ],
  "complexity": [
    {
      "severity": "medium",
      "message": "High cyclomatic complexity",
      "file": "src/utils.js",
      "description": "Function has complexity of 15. Consider breaking into smaller functions."
    }
  ],
  "performance": [
    {
      "severity": "low",
      "message": "Inefficient loop operation",
      "file": "src/processor.js",
      "description": "Array.push() in loop can be optimized using spread operator."
    }
  ]
}
```

**Status Codes:**
- `200` - Analysis successful
- `400` - Invalid request (missing or invalid diff)
- `413` - Payload too large (>50MB)
- `429` - Rate limit exceeded
- `500` - Internal server error

#### GET /api/health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-01T20:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### API Usage Examples

#### cURL
```bash
# Analyze a diff file
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "diff": "$(cat changes.diff)"
}
EOF

# Health check
curl http://localhost:3000/api/health
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    diff: diffContent
  })
});

const result = await response.json();
console.log('Risk Score:', result.riskScore);
```

#### Python (Requests)
```python
import requests

with open('changes.diff', 'r') as f:
    diff_content = f.read()

response = requests.post(
    'http://localhost:3000/api/analyze',
    json={'diff': diff_content}
)

result = response.json()
print(f"Risk Score: {result['riskScore']}")
```

## 📦 Deployment Guide

### Local Deployment

Already covered in [Quick Start](#-quick-start) section.

### Heroku Deployment

1. **Create a Heroku app:**
   ```bash
   heroku create your-codeguard-app
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3000
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **Open your app:**
   ```bash
   heroku open
   ```

### Docker Deployment (Coming Soon)

```dockerfile
# Dockerfile (example)
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "web"]
```

```bash
# Build and run
docker build -t codeguard-ai .
docker run -p 3000:3000 codeguard-ai
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `localhost` | No |
| `NODE_ENV` | Environment | `development` | No |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3000` | No |

### Production Considerations

#### Security
- ✅ Enable HTTPS in production
- ✅ Configure CORS for your domain
- ✅ Set strong rate limits
- ✅ Use environment variables for secrets
- ✅ Enable Helmet.js security headers

#### Performance
- ✅ Use a process manager (PM2, systemd)
- ✅ Enable clustering for multi-core systems
- ✅ Set up load balancing for high traffic
- ✅ Configure caching headers
- ✅ Monitor memory usage

#### Monitoring
- ✅ Set up log aggregation (Winston → CloudWatch/Datadog)
- ✅ Configure health check endpoints
- ✅ Set up uptime monitoring
- ✅ Track API response times
- ✅ Monitor error rates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CodeGuard AI System                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Web Server Layer (Express)             │    │
│  │  • Rate Limiting  • CORS  • Security Headers        │    │
│  │  • Request Validation  • Error Handling             │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │                  API Endpoints                      │    │
│  │  • POST /api/analyze  • GET /api/health            │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Frontend (Vanilla JS)                  │    │
│  │  • PR Comment Simulator  • File Upload              │    │
│  │  • Real-time Analysis  • GitHub-like UI             │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Core Analysis Engine                     │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Diff Parser  │  │ Risk Engine  │               │    │
│  │  │ • AST Parse  │  │ • Scoring    │               │    │
│  │  │ • Extract    │  │ • Weighting  │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Decision     │  │ Report       │               │    │
│  │  │ Engine       │  │ Generator    │               │    │
│  │  │ • Gate CI/CD │  │ • Insights   │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Observability Layer (Winston)               │    │
│  │  • Structured Logging  • Daily Rotation             │    │
│  │  • Error Tracking  • Performance Metrics            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **Diff Parser** (`src/agent/diffParser.js`)
- Extracts code changes from git diffs
- Parses file paths, line numbers, and modifications
- Supports unified diff format

#### 2. **Risk Engine** (`src/agent/riskEngine.js`)
- Calculates deployment risk (0-100 scale)
- Analyzes security, complexity, and performance
- Applies intelligent weighting to findings

#### 3. **Decision Engine** (`src/pipeline/decisionEngine.js`)
- Makes approve/block/review decisions
- Gates CI/CD pipeline based on risk score
- Returns appropriate exit codes

#### 4. **Report Generator** (`src/agent/reportGenerator.js`)
- Generates detailed analysis reports
- Provides actionable insights and recommendations
- Formats output for different consumers (CLI, API, Web)

#### 5. **Web Server** (`src/web/server.js`)
- Express-based HTTP server
- Serves static frontend files
- Exposes REST API endpoints
- Implements security middleware

#### 6. **Frontend** (`src/web/public/`)
- Vanilla JavaScript (no framework dependencies)
- GitHub-inspired UI design
- Real-time analysis feedback
- Responsive and accessible

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **start** | `npm start` | Run CLI analysis mode |
| **analyze** | `npm run analyze` | Alias for CLI analysis |
| **web** | `npm run web` | Start web server (production) |
| **dev** | `npm run dev` | Start web server with auto-reload |
| **test** | `npm test` | Run test suite |
| **lint** | `npm run lint` | Lint code with ESLint |
| **format** | `npm run format` | Format code with Prettier |
| **prepare** | `npm run prepare` | Create log directories |

## 🔗 CI/CD Integration

### GitHub Actions

```yaml
name: CodeGuard AI Analysis

on:
  pull_request:
    branches: [main, develop]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '14'
      
      - name: Install CodeGuard AI
        run: |
          npm install -g codeguard-ai
      
      - name: Generate Diff
        run: |
          git diff origin/main...HEAD > changes.diff
      
      - name: Run Analysis
        run: |
          codeguard changes.diff
```

### GitLab CI

```yaml
codeguard:
  stage: test
  image: node:14
  script:
    - npm install -g codeguard-ai
    - git diff origin/main...HEAD > changes.diff
    - codeguard changes.diff
  only:
    - merge_requests
```

### Jenkins

```groovy
pipeline {
  agent any
  stages {
    stage('CodeGuard Analysis') {
      steps {
        sh 'npm install -g codeguard-ai'
        sh 'git diff origin/main...HEAD > changes.diff'
        sh 'codeguard changes.diff'
      }
    }
  }
}
```

### Exit Codes

CodeGuard AI uses standard exit codes for CI/CD integration:

| Exit Code | Status | Description | CI Action |
|-----------|--------|-------------|-----------|
| `0` | ✅ **Auto-approved** | Low risk (0-30) | Deploy automatically |
| `1` | ❌ **Blocked** | Critical issues (81-100) | Block deployment |
| `2` | ⚠️ **Requires approval** | Medium/High risk (31-80) | Manual review required |

## 📊 Output Examples

### CLI Output

```
╔══════════════════════════════════════════════════════════════╗
║                    CodeGuard AI Analysis                      ║
╚══════════════════════════════════════════════════════════════╝

📊 Risk Assessment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Risk Score: 75/100 (HIGH)
Files Analyzed: 3
Total Findings: 6

🔒 Security Issues (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[HIGH] Potential SQL injection vulnerability
  File: src/database.js
  → User input is directly concatenated into SQL query
  → Recommendation: Use parameterized queries

🧩 Complexity Issues (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MEDIUM] High cyclomatic complexity
  File: src/utils.js
  → Function has complexity of 15
  → Recommendation: Break into smaller functions

⚡ Performance Concerns (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[LOW] Inefficient loop operation
  File: src/processor.js
  → Array.push() in loop can be optimized
  → Recommendation: Use spread operator

🚨 Deployment Decision: REQUIRES APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This PR requires manual review before deployment.
Address security issues before proceeding.
```

### Web UI Output

The web interface displays results in a GitHub-style PR comment format with:
- Color-coded risk badges
- Collapsible finding sections
- Severity indicators
- File paths and line numbers
- Detailed recommendations
- Copy-to-clipboard functionality

## 🛠️ Development

### Project Structure

```
codeguard-ai/
├── src/
│   ├── index.js                 # CLI entry point
│   ├── agent/
│   │   ├── analyzer.js          # Main analysis orchestrator
│   │   ├── diffParser.js        # Git diff parser
│   │   ├── riskEngine.js        # Risk scoring engine
│   │   └── reportGenerator.js   # Report formatter
│   ├── pipeline/
│   │   ├── ciSimulator.js       # CI/CD simulator
│   │   └── decisionEngine.js    # Deployment decision logic
│   ├── observability/
│   │   └── logger.js            # Winston logger configuration
│   └── web/
│       ├── server.js            # Express server
│       ├── config.js            # Server configuration
│       ├── middleware/
│       │   ├── security.js      # Security middleware
│       │   ├── validation.js    # Request validation
│       │   └── errorHandler.js  # Error handling
│       ├── routes/
│       │   └── analyze.js       # API routes
│       └── public/
│           ├── index.html       # Web UI
│           ├── css/
│           │   └── styles.css   # Styles
│           └── js/
│               └── app.js       # Frontend logic
├── examples/
│   └── sample.diff              # Sample diff for testing
├── logs/                        # Application logs
├── .github/
│   └── workflows/
│       └── codeguard.yml        # GitHub Actions workflow
├── package.json
├── README.md
├── DEMO.md
└── LICENSE
```

### Adding New Features

1. **Backend**: Add logic to `src/agent/` or `src/pipeline/`
2. **API**: Add routes to `src/web/routes/`
3. **Frontend**: Update `src/web/public/`
4. **Tests**: Add tests (when test suite is implemented)
5. **Documentation**: Update this README

### Code Style

- **Linting**: ESLint with Airbnb base config
- **Formatting**: Prettier
- **Conventions**: 
  - Use camelCase for variables and functions
  - Use PascalCase for classes
  - Add JSDoc comments for public APIs
  - Keep functions small and focused

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by Bob
- Inspired by the need for better deployment safety
- Thanks to all contributors and users

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/codeguard-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/codeguard-ai/discussions)
- **Email**: your.email@example.com

## 🗺️ Roadmap

- [x] Core analysis engine
- [x] CLI interface
- [x] Web UI with PR simulator
- [x] REST API
- [x] Rate limiting and security
- [ ] Docker support
- [ ] GitHub App integration
- [ ] Custom rule configuration
- [ ] Historical analysis dashboard
- [ ] Team collaboration features
- [ ] Slack/Discord notifications
- [ ] Advanced ML models
- [ ] Multi-language support

---

**Made with ❤️ by Bob** | [Documentation](README.md) | [Demo](DEMO.md) | [Frontend Guide](src/web/public/FRONTEND_GUIDE.md)