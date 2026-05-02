/**
 * Unit Tests - Analyzer
 */

const {
  detectSecurityIssues,
  calculateCyclomaticComplexity,
  parseToAST,
  CONFIG,
} = require('../../src/agent/analyzer');

describe('Analyzer', () => {
  describe('detectSecurityIssues', () => {
    test('should detect SQL injection vulnerability', () => {
      const code = 'const query = `SELECT * FROM users WHERE id = ${userId}`;';
      const findings = detectSecurityIssues(code, 'test.js');

      const sqlInjection = findings.find((f) => f.type === 'sql_injection');
      expect(sqlInjection).toBeDefined();
      expect(sqlInjection.severity).toBe('critical');
    });

    test('should detect dangerous eval function', () => {
      const code = 'eval(userInput);';
      const findings = detectSecurityIssues(code, 'test.js');

      const dangerousFunc = findings.find((f) => f.type === 'dangerous_function');
      expect(dangerousFunc).toBeDefined();
      expect(dangerousFunc.message).toContain('eval');
    });

    test('should detect hardcoded secrets', () => {
      const code = 'const apiKey = "sk-1234567890abcdef";';
      const findings = detectSecurityIssues(code, 'test.js');

      const secret = findings.find((f) => f.type === 'hardcoded_secret');
      expect(secret).toBeDefined();
      expect(secret.severity).toBe('high');
    });

    test('should detect XSS vulnerability', () => {
      const code = 'element.innerHTML = userInput;';
      const findings = detectSecurityIssues(code, 'test.js');

      const xss = findings.find((f) => f.type === 'xss');
      expect(xss).toBeDefined();
    });

    test('should detect command injection', () => {
      const code = 'exec(`rm -rf ${userInput}`);';
      const findings = detectSecurityIssues(code, 'test.js');

      const cmdInjection = findings.find((f) => f.type === 'command_injection');
      expect(cmdInjection).toBeDefined();
      expect(cmdInjection.severity).toBe('critical');
    });

    test('should detect path traversal', () => {
      const code = 'fs.readFile(`../../${filename}`);';
      const findings = detectSecurityIssues(code, 'test.js');

      const pathTraversal = findings.find((f) => f.type === 'path_traversal');
      expect(pathTraversal).toBeDefined();
    });

    test('should return empty array for safe code', () => {
      const code = 'const x = 1 + 2;';
      const findings = detectSecurityIssues(code, 'test.js');

      expect(findings).toHaveLength(0);
    });

    test('should include line numbers in findings', () => {
      const code = 'const x = 1;\neval(userInput);\nconst y = 2;';
      const findings = detectSecurityIssues(code, 'test.js');

      expect(findings[0]).toHaveProperty('line');
      expect(findings[0].line).toBe(2);
    });
  });

  describe('parseToAST', () => {
    test('should parse valid JavaScript code', () => {
      const code = 'const x = 1 + 2;';
      const ast = parseToAST(code, 'test.js');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
    });

    test('should return null for invalid JavaScript', () => {
      const code = 'const x = ;';
      const ast = parseToAST(code, 'test.js');

      expect(ast).toBeNull();
    });

    test('should handle ES6+ syntax', () => {
      const code = 'const arrow = () => { return 42; };';
      const ast = parseToAST(code, 'test.js');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
    });

    test('should reject code exceeding size limit', () => {
      const code = 'x'.repeat(CONFIG.MAX_CODE_SIZE + 1);
      const ast = parseToAST(code, 'test.js');

      expect(ast).toBeNull();
    });

    test('should handle async/await', () => {
      const code = 'async function test() { await fetch(); }';
      const ast = parseToAST(code, 'test.js');

      expect(ast).toBeDefined();
    });
  });

  describe('calculateCyclomaticComplexity', () => {
    test('should return 1 for simple code', () => {
      const code = 'const x = 1;';
      const ast = parseToAST(code, 'test.js');
      const complexity = calculateCyclomaticComplexity(ast);

      expect(complexity).toBe(1);
    });

    test('should count if statements', () => {
      const code = 'if (x > 0) { return true; }';
      const ast = parseToAST(code, 'test.js');
      const complexity = calculateCyclomaticComplexity(ast);

      expect(complexity).toBeGreaterThan(1);
    });

    test('should count loops', () => {
      const code = 'for (let i = 0; i < 10; i++) { console.log(i); }';
      const ast = parseToAST(code, 'test.js');
      const complexity = calculateCyclomaticComplexity(ast);

      expect(complexity).toBeGreaterThan(1);
    });

    test('should count logical operators', () => {
      const code = 'if (x > 0 && y < 10) { return true; }';
      const ast = parseToAST(code, 'test.js');
      const complexity = calculateCyclomaticComplexity(ast);

      expect(complexity).toBeGreaterThan(2);
    });

    test('should handle nested conditions', () => {
      const code = `
        if (a) {
          if (b) {
            if (c) {
              return true;
            }
          }
        }
      `;
      const ast = parseToAST(code, 'test.js');
      const complexity = calculateCyclomaticComplexity(ast);

      expect(complexity).toBeGreaterThanOrEqual(3);
    });

    test('should count switch cases', () => {
      const code = `
        switch (x) {
          case 1: return 'one';
          case 2: return 'two';
          default: return 'other';
        }
      `;
      const ast = parseToAST(code, 'test.js');
      const complexity = calculateCyclomaticComplexity(ast);

      expect(complexity).toBeGreaterThan(1);
    });
  });
});

// Made with Bob
