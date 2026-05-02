# CodeGuard AI - Multi-Mode Architecture

## Overview

CodeGuard AI features a sophisticated multi-mode architecture that enables comprehensive code analysis from different perspectives. Each mode specializes in specific aspects of code review, and the Orchestrator Mode coordinates them for holistic analysis.

## Available Modes

### 1. 🎯 Plan Mode - Architecture & System Design

**Purpose**: Analyzes code changes from an architectural and design perspective.

**Capabilities**:
- Design pattern detection (Singleton, Factory, Observer, Strategy, etc.)
- Architecture assessment (MVC, Microservices, Layered, Event-Driven)
- Scalability analysis
- Maintainability evaluation
- Technical debt identification
- Dependency analysis

**Use Cases**:
- Architecture reviews
- System design validation
- Refactoring planning
- Technical debt assessment

**API Endpoint**:
```bash
POST /api/modes/analyze
{
  "diffContent": "...",
  "mode": "plan"
}
```

**Example Response**:
```json
{
  "success": true,
  "mode": "plan",
  "analysis": {
    "architecture": {
      "detectedPatterns": ["mvc", "layered"],
      "confidence": 0.85
    },
    "designPatterns": [
      {
        "pattern": "Repository",
        "file": "src/repository/userRepository.js",
        "confidence": 0.9
      }
    ],
    "scalability": {
      "score": 85,
      "level": "Good",
      "concerns": []
    },
    "maintainability": {
      "score": 78,
      "level": "Good"
    },
    "technicalDebt": {
      "total": 5,
      "items": [...]
    }
  }
}
```

---

### 2. 💻 Code Mode - Backend/Frontend Code Generation & Analysis

**Purpose**: Deep code-level analysis focusing on quality, security, and performance.

**Capabilities**:
- Code quality analysis (complexity, duplication, documentation)
- Security vulnerability detection (SQL injection, XSS, secrets)
- Performance optimization recommendations
- Best practices validation
- Code generation suggestions
- Refactoring recommendations

**Use Cases**:
- Code reviews
- Security audits
- Performance optimization
- Quality assurance

**API Endpoint**:
```bash
POST /api/modes/analyze
{
  "diffContent": "...",
  "mode": "code"
}
```

**Example Response**:
```json
{
  "success": true,
  "mode": "code",
  "analysis": {
    "risk": {
      "level": "MEDIUM",
      "score": 45
    },
    "quality": {
      "metrics": {
        "complexity": 8,
        "duplication": 5,
        "documentation": 75,
        "maintainability": 82
      },
      "grade": "B"
    },
    "security": {
      "total": 3,
      "critical": 0,
      "high": 1,
      "findings": [...]
    },
    "performance": {
      "score": 85,
      "level": "Good",
      "issues": []
    }
  }
}
```

---

### 3. 🚀 Advanced Mode - Refine Prompts & Logic

**Purpose**: AI-driven analysis with intelligent pattern recognition and predictive insights.

**Capabilities**:
- Intelligent pattern recognition
- Context-aware analysis
- Prompt optimization
- Machine learning insights
- Predictive risk assessment
- Automated decision support

**Use Cases**:
- Complex code analysis
- Risk prediction
- Intelligent recommendations
- Context-aware reviews

**API Endpoint**:
```bash
POST /api/modes/analyze
{
  "diffContent": "...",
  "mode": "advanced"
}
```

**Example Response**:
```json
{
  "success": true,
  "mode": "advanced",
  "analysis": {
    "context": {
      "projectType": "microservice",
      "changeScope": {
        "files": 5,
        "additions": 120,
        "deletions": 45
      },
      "impactRadius": {
        "directories": 3,
        "level": "medium"
      }
    },
    "patterns": {
      "coding": [...],
      "architectural": [...],
      "security": [...],
      "total": 12,
      "confidence": 0.87
    },
    "predictiveRisk": {
      "score": 42,
      "level": "MEDIUM",
      "likelihood": {
        "deployment_issues": "medium",
        "bugs": "low",
        "security_incidents": "low"
      },
      "confidence": 0.85
    }
  }
}
```

---

### 4. 🎭 Orchestrator Mode - Connect Flows

**Purpose**: Coordinates multiple modes for comprehensive, multi-perspective analysis.

**Capabilities**:
- Multi-mode coordination
- Workflow orchestration
- Result aggregation
- Priority-based execution
- Parallel processing
- Comprehensive reporting

**Use Cases**:
- Production readiness checks
- Comprehensive code reviews
- Multi-perspective analysis
- Executive reporting

**API Endpoint**:
```bash
POST /api/modes/orchestrate
{
  "diffContent": "...",
  "workflow": "comprehensive",
  "modes": ["plan", "code", "advanced"]
}
```

**Example Response**:
```json
{
  "success": true,
  "mode": "orchestrator",
  "workflow": "Comprehensive Analysis",
  "results": {
    "summary": {
      "overallRisk": "MEDIUM",
      "confidence": 0.85,
      "keyFindings": [
        "Code analysis: MEDIUM risk",
        "Scalability concerns detected"
      ],
      "criticalIssues": 0,
      "warnings": 3
    },
    "risks": {
      "overall": "MEDIUM",
      "score": 45,
      "breakdown": {
        "security": { "level": "LOW", "score": 15 },
        "performance": { "level": "MEDIUM", "score": 35 },
        "architecture": { "level": "LOW", "score": 20 }
      }
    },
    "recommendations": {
      "total": 8,
      "byPriority": {
        "high": 2,
        "medium": 4,
        "low": 2
      }
    }
  },
  "report": {
    "executive_summary": {
      "overall_risk": "MEDIUM",
      "recommendation": "REVIEW REQUIRED - Address concerns before deployment"
    },
    "action_items": {
      "immediate": [...],
      "short_term": [...],
      "long_term": [...]
    }
  }
}
```

---

## Workflows

The Orchestrator Mode supports predefined workflows:

### 1. Comprehensive Analysis
- **Modes**: Plan + Code + Advanced
- **Execution**: Sequential
- **Use Case**: Complete production readiness check

### 2. Quick Analysis
- **Modes**: Code only
- **Execution**: Sequential
- **Use Case**: Fast code review

### 3. Security-Focused
- **Modes**: Code + Advanced
- **Execution**: Parallel
- **Use Case**: Security audit

### 4. Architecture Review
- **Modes**: Plan + Advanced
- **Execution**: Sequential
- **Use Case**: Design and architecture validation

### 5. Production Readiness
- **Modes**: Plan + Code + Advanced
- **Execution**: Sequential
- **Use Case**: Pre-deployment verification

---

## API Endpoints

### List All Modes
```bash
GET /api/modes
```

**Response**:
```json
{
  "success": true,
  "modes": [
    {
      "name": "plan",
      "info": {
        "name": "Plan Mode",
        "description": "Architecture and system design analysis",
        "capabilities": [...]
      }
    },
    ...
  ],
  "total": 4
}
```

### Get Mode Information
```bash
GET /api/modes/:modeName
```

**Response**:
```json
{
  "success": true,
  "mode": "plan",
  "info": {
    "name": "Plan Mode",
    "description": "Architecture and system design analysis",
    "capabilities": [
      "Design pattern detection",
      "Architecture assessment",
      ...
    ]
  }
}
```

### Analyze with Specific Mode
```bash
POST /api/modes/analyze
Content-Type: application/json

{
  "diffContent": "diff --git a/file.js...",
  "mode": "code"
}
```

### Orchestrate Multi-Mode Analysis
```bash
POST /api/modes/orchestrate
Content-Type: application/json

{
  "diffContent": "diff --git a/file.js...",
  "workflow": "comprehensive",
  "modes": ["plan", "code", "advanced"]
}
```

---

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Single mode analysis
const analyzeWithMode = async (diffContent, mode) => {
  const response = await axios.post('http://localhost:3000/api/modes/analyze', {
    diffContent,
    mode
  });
  return response.data;
};

// Orchestrated analysis
const orchestrateAnalysis = async (diffContent, workflow = 'comprehensive') => {
  const response = await axios.post('http://localhost:3000/api/modes/orchestrate', {
    diffContent,
    workflow,
    modes: ['plan', 'code', 'advanced']
  });
  return response.data;
};

// Usage
const diff = fs.readFileSync('changes.diff', 'utf8');
const result = await orchestrateAnalysis(diff);
console.log(result.report.executive_summary);
```

### Python
```python
import requests

def analyze_with_mode(diff_content, mode='code'):
    response = requests.post(
        'http://localhost:3000/api/modes/analyze',
        json={'diffContent': diff_content, 'mode': mode}
    )
    return response.json()

def orchestrate_analysis(diff_content, workflow='comprehensive'):
    response = requests.post(
        'http://localhost:3000/api/modes/orchestrate',
        json={
            'diffContent': diff_content,
            'workflow': workflow,
            'modes': ['plan', 'code', 'advanced']
        }
    )
    return response.json()

# Usage
with open('changes.diff', 'r') as f:
    diff = f.read()

result = orchestrate_analysis(diff)
print(result['report']['executive_summary'])
```

### cURL
```bash
# Single mode
curl -X POST http://localhost:3000/api/modes/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "diffContent": "diff --git a/file.js...",
    "mode": "code"
  }'

# Orchestrated
curl -X POST http://localhost:3000/api/modes/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "diffContent": "diff --git a/file.js...",
    "workflow": "comprehensive",
    "modes": ["plan", "code", "advanced"]
  }'
```

---

## Mode Selection Guide

| Scenario | Recommended Mode | Reason |
|----------|-----------------|---------|
| Quick code review | Code Mode | Fast, focused on code quality |
| Architecture changes | Plan Mode | Evaluates design and structure |
| Security audit | Code + Advanced | Deep security analysis |
| Pre-deployment | Orchestrator (comprehensive) | Complete validation |
| Performance optimization | Code Mode | Identifies performance issues |
| Technical debt assessment | Plan Mode | Tracks debt and maintainability |
| Risk prediction | Advanced Mode | Predictive insights |
| Executive reporting | Orchestrator | Comprehensive reports |

---

## Best Practices

1. **Use Orchestrator for Production**: Always use comprehensive workflow before deploying to production
2. **Mode Selection**: Choose the right mode based on your specific needs
3. **Parallel Execution**: Use parallel workflows for independent analyses
4. **Sequential for Context**: Use sequential when later modes need context from earlier ones
5. **Cache Results**: Cache mode results to avoid redundant analysis
6. **Monitor Performance**: Track execution times and optimize workflows

---

## Performance Considerations

- **Code Mode**: ~500ms for typical PR
- **Plan Mode**: ~300ms for typical PR
- **Advanced Mode**: ~400ms for typical PR
- **Orchestrator (Sequential)**: ~1.2s for comprehensive analysis
- **Orchestrator (Parallel)**: ~600ms for parallel workflows

---

## Future Enhancements

- [ ] Custom workflow creation
- [ ] Mode plugins system
- [ ] Real-time streaming results
- [ ] Historical trend analysis
- [ ] Team-specific mode configurations
- [ ] Integration with CI/CD platforms
- [ ] Machine learning model training
- [ ] Custom pattern definitions

---

## Support

For questions or issues with the multi-mode architecture:
- GitHub Issues: https://github.com/yourusername/codeguard-ai/issues
- Documentation: https://github.com/yourusername/codeguard-ai/wiki
- Email: support@codeguard-ai.com

---

**Made with ❤️ by the CodeGuard AI Team**