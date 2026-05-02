/**
 * Integration Tests - API Endpoints
 */

const request = require('supertest');
const app = require('../../src/web/server');
const fixtures = require('../fixtures/sample-diffs');

describe('API Integration Tests', () => {
  describe('POST /api/analyze', () => {
    test('should analyze a valid diff', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.simpleDiff })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('riskLevel');
      expect(response.body).toHaveProperty('filesAnalyzed');
      expect(response.body.riskScore).toBeGreaterThanOrEqual(0);
      expect(response.body.riskScore).toBeLessThanOrEqual(100);
    });

    test('should detect security issues in diff', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.securityIssueDiff })
        .expect(200);

      expect(response.body).toHaveProperty('security');
      expect(Array.isArray(response.body.security)).toBe(true);
      expect(response.body.security.length).toBeGreaterThan(0);
    });

    test('should return 400 for missing diff', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid diff format', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty diff', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.emptyDiff })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
    });

    test('should analyze multi-file diff', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.multiFileDiff })
        .expect(200);

      expect(response.body.filesAnalyzed).toBeGreaterThan(1);
    });

    test('should include complexity issues', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.complexityIssueDiff })
        .expect(200);

      expect(response.body).toHaveProperty('complexity');
      expect(Array.isArray(response.body.complexity)).toBe(true);
    });

    test('should return proper content type', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.simpleDiff })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('should handle large diffs', async () => {
      const largeDiff = fixtures.simpleDiff.repeat(100);
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: largeDiff })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
    });

    test('should include summary in response', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ diff: fixtures.simpleDiff })
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(typeof response.body.summary).toBe('string');
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    test('should include timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
    });

    test('should include uptime', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    test('should include version', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/api/unknown')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('CORS', () => {
    test('should handle CORS preflight', async () => {
      const response = await request(app)
        .options('/api/analyze')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});

// Made with Bob
