import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Loader2,
  TrendingUp,
  GitBranch,
  FileCode,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'

const EXAMPLE_DIFF = `diff --git a/src/auth.js b/src/auth.js
index 1234567..abcdefg 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -10,7 +10,7 @@ function authenticateUser(username, password) {
-  const query = "SELECT * FROM users WHERE username = '" + username + "'";
+  const query = \`SELECT * FROM users WHERE username = ?\`;
-  db.query(query, (err, results) => {
+  db.query(query, [username], (err, results) => {`

export default function Dashboard() {
  const [diffInput, setDiffInput] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyzeDiff = async () => {
    if (!diffInput.trim()) {
      setError('Please enter a diff to analyze')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diff: diffInput }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err.message || 'Failed to analyze diff')
    } finally {
      setLoading(false)
    }
  }

  const loadExample = () => {
    setDiffInput(EXAMPLE_DIFF)
    setAnalysis(null)
    setError(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const getRiskColor = (level) => {
    const colors = {
      critical: 'text-red-500',
      high: 'text-orange-500',
      medium: 'text-yellow-500',
      low: 'text-green-500',
    }
    return colors[level] || 'text-gray-500'
  }

  const getRiskBadgeVariant = (level) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'default',
    }
    return variants[level] || 'default'
  }

  const getDecisionIcon = (decision) => {
    if (decision === 'approve') return <CheckCircle2 className="w-5 h-5 text-green-500" />
    if (decision === 'reject') return <XCircle className="w-5 h-5 text-red-500" />
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">CodeGuard AI</h1>
          </div>
          <p className="text-gray-300 text-lg">
            AI-Powered Code Review & Security Analysis
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Analyze Git Diff</CardTitle>
              <CardDescription className="text-gray-400">
                Paste your git diff below for AI-powered security and quality analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your git diff here..."
                value={diffInput}
                onChange={(e) => setDiffInput(e.target.value)}
                className="min-h-[200px] bg-slate-900/50 border-slate-600 text-white font-mono text-sm"
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={analyzeDiff}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Analyze Diff
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={loadExample}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  Load Example
                </Button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-6"
            >
              {/* Decision Card */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      {getDecisionIcon(analysis.decision)}
                      Pipeline Decision
                    </CardTitle>
                    <Badge variant={getRiskBadgeVariant(analysis.overallRisk)}>
                      {analysis.overallRisk.toUpperCase()} RISK
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-white font-medium mb-2">
                        Decision: <span className="text-purple-400">{analysis.decision.toUpperCase()}</span>
                      </p>
                      <p className="text-gray-400 text-sm">{analysis.reasoning}</p>
                    </div>

                    {analysis.businessImpact && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="text-yellow-400 font-medium mb-1">Business Impact Warning</p>
                            <p className="text-gray-300 text-sm">{analysis.businessImpact}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Risk Score</p>
                          <p className={`text-3xl font-bold ${getRiskColor(analysis.overallRisk)}`}>
                            {analysis.riskScore}
                          </p>
                        </div>
                        <TrendingUp className={`w-8 h-8 ${getRiskColor(analysis.overallRisk)}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Issues Found</p>
                          <p className="text-3xl font-bold text-white">
                            {analysis.issues?.length || 0}
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Files Changed</p>
                          <p className="text-3xl font-bold text-white">
                            {analysis.filesChanged || 0}
                          </p>
                        </div>
                        <GitBranch className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Issues List */}
              {analysis.issues && analysis.issues.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Security & Quality Issues</CardTitle>
                    <CardDescription className="text-gray-400">
                      Detailed analysis of potential problems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.issues.map((issue, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getRiskBadgeVariant(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              <span className="text-gray-400 text-sm">{issue.type}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(issue.description)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-white mb-2">{issue.description}</p>
                          {issue.file && (
                            <p className="text-gray-500 text-sm font-mono">
                              {issue.file}:{issue.line}
                            </p>
                          )}
                          {issue.suggestion && (
                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
                              <p className="text-green-400 text-sm">
                                <strong>Suggestion:</strong> {issue.suggestion}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full Report */}
              {analysis.report && (
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Full Analysis Report</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(analysis.report)}
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                      {analysis.report}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Made with Bob
