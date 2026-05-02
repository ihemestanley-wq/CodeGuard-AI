# CodeGuard AI - API Documentation

Complete API reference for CodeGuard AI REST endpoints.

## Base URL

```
http://localhost:3000/api
```

For production deployments, replace with your actual domain.

## Authentication

Currently, the API does not require authentication. For production use, implement authentication at the reverse proxy level or use the planned OAuth2/JWT support in future versions.

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

When rate limit is exceeded:
```json
{
  "error": "Too many requests, please try again later."
}
```

## Endpoints

### 1. Analyze Code Changes

Analyze a git diff and return risk assessment with security findings.

**Endpoint**: `POST /api/analyze`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "diff": "diff --git a/src/app.js b/src/app.js\nindex 1234567..abcdefg 100644\n--- a/src/app.js\n+++ b/src/app.js\n@@ -1,3 +1,4 @@\n+const express = require('express');\n const app = express();\n \n app.listen(3000);"
}
```

**Parameters**:

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| diff      | string | Yes      | Git diff content (unified format) |

**Success Response** (200 OK):
```json
{
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "summary": "This PR introduces moderate risk changes that require standard review before deployment.",
  "filesAnalyzed": 3,
  "totalFindings": 5,
  "security": [
    {
      "severity": "high",
      "message": "Potential SQL injection vulnerability",
      "file": "src/database.js",
      "line": 15,
      "type": "sql_injection",
      "description": "User input is directly concatenated into SQL query. Use parameterized queries instead.",
      "recommendation": "Replace string concatenation with prepared statements"
    }
  ],
  "complexity": [
    {
      "severity": "medium",
      "message": "High cyclomatic complexity",
      "file": "src/utils.js",
      "complexity": 15,
      "threshold": 10,
      "description": "Function has complexity of 15, which exceeds the threshold of 10.",
      "recommendation": "Consider breaking this function into smaller, more focused functions"
    }
  ],
  "performance": [
    {
      "severity": "low",
      "message": "Inefficient loop operation",
      "file": "src/processor.js",
      "line": 42,
      "description": "Array.push() in loop can be optimized.",
      "recommendation": "Use spread operator or Array.concat() for better performance"
    }
  ],
  "criticalFiles": ["src/auth.js", "src/database.js"],
  "patterns": ["Authentication Changes", "Database Modifications"],
  "recommendation": "REQUIRE_APPROVAL",
  "deploymentGuidance": {
    "canDeploy": false,
    "requiresReview": true,
    "blockers": ["High severity security issues"],
    "suggestions": [
      "Address SQL injection vulnerability in src/database.js",
      "Reduce complexity in src/utils.js",
      "Add security review for authentication changes"
    ]
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid or missing diff:
```json
{
  "error": "Diff content is required",
  "code": "MISSING_DIFF"
}
```

**413 Payload Too Large** - Diff exceeds size limit:
```json
{
  "error": "Diff size exceeds maximum allowed size of 50MB",
  "code": "PAYLOAD_TOO_LARGE"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "error": "Too many requests, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

### 2. Health Check

Check if the API is running and healthy.

**Endpoint**: `GET /api/health`

**Request Headers**: None required

**Success Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-05-01T20:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

**Response Fields**:

| Field       | Type   | Description                           |
|-------------|--------|---------------------------------------|
| status      | string | Health status ("ok" or "error")       |
| timestamp   | string | Current server time (ISO 8601)        |
| uptime      | number | Server uptime in seconds              |
| version     | string | API version                           |
| environment | string | Current environment (dev/prod/test)   |

---

## Response Schemas

### Risk Levels

| Level    | Score Range | Description                          |
|----------|-------------|--------------------------------------|
| LOW      | 0-30        | Safe to deploy automatically         |
| MEDIUM   | 31-60       | Requires standard review             |
| HIGH     | 61-80       | Requires thorough review             |
| CRITICAL | 81-100      | Blocks deployment, must be revised   |

### Severity Levels

| Severity | Description                                    |
|----------|------------------------------------------------|
| critical | Immediate security threat, blocks deployment  |
| high     | Significant issue, requires attention          |
| medium   | Moderate concern, should be addressed          |
| low      | Minor issue, can be addressed later            |

### Finding Types

**Security**:
- `sql_injection` - SQL injection vulnerability
- `xss` - Cross-site scripting vulnerability
- `command_injection` - Command injection vulnerability
- `hardcoded_secret` - Hardcoded credentials or secrets
- `path_traversal` - Path traversal vulnerability
- `dangerous_function` - Use of dangerous functions (eval, exec, etc.)

**Complexity**:
- `high_complexity` - Cyclomatic complexity exceeds threshold
- `deep_nesting` - Excessive nesting depth
- `long_function` - Function exceeds recommended length

**Performance**:
- `inefficient_loop` - Inefficient loop operations
- `memory_leak` - Potential memory leak
- `blocking_operation` - Blocking I/O operation

---

## Usage Examples

### cURL

```bash
# Analyze a diff file
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "diff": "'"$(cat changes.diff)"'"
  }'

# Health check
curl http://localhost:3000/api/health
```

### JavaScript (Fetch API)

```javascript
// Analyze diff
const analyzeDiff = async (diffContent) => {
  const response = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ diff: diffContent }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Usage
const diff = await fs.readFile('changes.diff', 'utf-8');
const result = await analyzeDiff(diff);
console.log('Risk Score:', result.riskScore);
console.log('Risk Level:', result.riskLevel);
```

### Python (Requests)

```python
import requests

# Analyze diff
def analyze_diff(diff_content):
    response = requests.post(
        'http://localhost:3000/api/analyze',
        json={'diff': diff_content}
    )
    response.raise_for_status()
    return response.json()

# Usage
with open('changes.diff', 'r') as f:
    diff = f.read()

result = analyze_diff(diff)
print(f"Risk Score: {result['riskScore']}")
print(f"Risk Level: {result['riskLevel']}")
```

### Node.js (Axios)

```javascript
const axios = require('axios');
const fs = require('fs').promises;

// Analyze diff
const analyzeDiff = async (diffContent) => {
  try {
    const response = await axios.post('http://localhost:3000/api/analyze', {
      diff: diffContent,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data);
    }
    throw error;
  }
};

// Usage
(async () => {
  const diff = await fs.readFile('changes.diff', 'utf-8');
  const result = await analyzeDiff(diff);
  console.log('Risk Score:', result.riskScore);
  console.log('Security Findings:', result.security.length);
})();
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

type AnalyzeRequest struct {
    Diff string `json:"diff"`
}

type AnalyzeResponse struct {
    RiskScore int    `json:"riskScore"`
    RiskLevel string `json:"riskLevel"`
    // Add other fields as needed
}

func analyzeDiff(diff string) (*AnalyzeResponse, error) {
    reqBody, _ := json.Marshal(AnalyzeRequest{Diff: diff})
    
    resp, err := http.Post(
        "http://localhost:3000/api/analyze",
        "application/json",
        bytes.NewBuffer(reqBody),
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result AnalyzeResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}

func main() {
    diff, _ := ioutil.ReadFile("changes.diff")
    result, _ := analyzeDiff(string(diff))
    fmt.Printf("Risk Score: %d\n", result.RiskScore)
    fmt.Printf("Risk Level: %s\n", result.RiskLevel)
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code                  | HTTP Status | Description                    |
|-----------------------|-------------|--------------------------------|
| MISSING_DIFF          | 400         | Diff content not provided      |
| INVALID_DIFF          | 400         | Diff format is invalid         |
| PAYLOAD_TOO_LARGE     | 413         | Diff exceeds size limit        |
| RATE_LIMIT_EXCEEDED   | 429         | Too many requests              |
| INTERNAL_ERROR        | 500         | Server error                   |

---

## Best Practices

### 1. Handle Rate Limits

```javascript
const analyzeWithRetry = async (diff, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzeDiff(diff);
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
};
```

### 2. Validate Diff Before Sending

```javascript
const validateDiff = (diff) => {
  if (!diff || typeof diff !== 'string') {
    throw new Error('Diff must be a non-empty string');
  }
  if (diff.length > 50 * 1024 * 1024) {
    throw new Error('Diff exceeds 50MB limit');
  }
  return true;
};
```

### 3. Process Results

```javascript
const processResults = (result) => {
  // Check if deployment should be blocked
  if (result.riskLevel === 'CRITICAL') {
    console.error('❌ Deployment blocked due to critical issues');
    process.exit(1);
  }

  // Log security findings
  if (result.security.length > 0) {
    console.warn(`⚠️  Found ${result.security.length} security issues`);
    result.security.forEach(finding => {
      console.warn(`  - ${finding.message} in ${finding.file}`);
    });
  }

  // Return appropriate exit code
  return result.riskLevel === 'LOW' ? 0 : 2;
};
```

---

## Webhooks (Future Feature)

Planned for v2.0:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["analysis.completed", "security.found"],
  "secret": "your-webhook-secret"
}
```

---

## SDK Support (Future Feature)

Official SDKs planned for:
- JavaScript/TypeScript
- Python
- Go
- Ruby
- Java

---

## Support

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/codeguard-ai/issues)
- **Security**: [SECURITY.md](SECURITY.md)

---

**API Version**: 1.0.0  
**Last Updated**: 2026-05-01  
**Made with ❤️ by the CodeGuard AI Team**