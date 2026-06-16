import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3J1aXRpbmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyMTI4OTYwMCwiZXhwIjoyMDI3MDQ2NDAwfQ.oJgo_WtaknNVZcsb3IRTDrU5YelUmdl-FGHtdbA1aug';

async function getAuthToken(request: any, role: 'Admin' | 'Recruiter' | 'Viewer') {
  let email = '';
  if (role === 'Admin') email = 'admin@recruiting.local';
  else if (role === 'Recruiter') email = 'recruiter@recruiting.local';
  else email = 'viewer@recruiting.local';

  const res = await request.post('/auth/v1/token?grant_type=password', {
    headers: {
      'apikey': ANON_KEY
    },
    data: {
      email,
      password: 'password123'
    }
  });

  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.access_token;
}

test.describe('API Endpoint Protection and Validation', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  // TC-AUTH-API-01: Redirects / returns 401 for unauthenticated API requests
  test('TC-AUTH-API-01: should return 401 for unauthenticated requests to candidates API', async ({ request }) => {
    const res = await request.get('/api/candidates');
    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  // TC-AUTH-API-02: Returns 403 for forbidden candidate deletes by Guest Viewer or Recruiter
  test('TC-AUTH-API-02: should return 403 when Recruiter tries to delete a candidate', async ({ request }) => {
    const token = await getAuthToken(request, 'Recruiter');
    
    // Pick John Doe (default ID seeded)
    const candId = 'c1111111-1111-1111-1111-111111111111';
    
    const res = await request.delete(`/api/candidates/${candId}`, {
      headers: {
        'Cookie': `sb-access-token=${token}`
      }
    });
    expect(res.status()).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Forbidden');
  });

  // TC-CAND-API-01: Returns 400 for candidate creation with missing name or invalid email
  test('TC-CAND-API-01: should return 400 on candidate registration with missing name or bad email', async ({ request }) => {
    const token = await getAuthToken(request, 'Recruiter');
    
    // Missing name
    const resName = await request.post('/api/candidates', {
      headers: {
        'Cookie': `sb-access-token=${token}`
      },
      data: {
        email: 'test@example.com',
        status: 'Applied'
      }
    });
    expect(resName.status()).toBe(400);
    expect((await resName.json()).error).toBe('Name is required');

    // Invalid email format
    const resEmail = await request.post('/api/candidates', {
      headers: {
        'Cookie': `sb-access-token=${token}`
      },
      data: {
        name: 'New Candidate',
        email: 'invalid-email-format',
        status: 'Applied'
      }
    });
    expect(resEmail.status()).toBe(400);
    expect((await resEmail.json()).error).toBe('Valid email is required');
  });

  // TC-PIPE-API-01: Returns 400 for invalid hiring status options
  test('TC-PIPE-API-01: should return 400 for invalid pipeline status values', async ({ request }) => {
    const token = await getAuthToken(request, 'Recruiter');

    // Create candidate with invalid status
    const res = await request.post('/api/candidates', {
      headers: {
        'Cookie': `sb-access-token=${token}`
      },
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'Drafting' // Invalid status
      }
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('Invalid candidate status');
  });

  // TC-WEB-API-01: Returns 401 for bad or missing webhook signatures
  test('TC-WEB-API-01: should return 401 for webhooks received with bad or missing signatures', async ({ request }) => {
    // Missing signature header
    const resMissing = await request.post('/api/webhooks', {
      data: {
        event: 'candidate.status_changed',
        candidate: { name: 'John' }
      }
    });
    expect(resMissing.status()).toBe(401);
    expect((await resMissing.json()).error).toBe('Missing X-Recruiting-Signature header');

    // Bad signature header
    const resBad = await request.post('/api/webhooks', {
      headers: {
        'X-Recruiting-Signature': 'incorrectsignaturevalue1234567890abcdef'
      },
      data: {
        event: 'candidate.status_changed',
        candidate: { name: 'John' }
      }
    });
    expect(resBad.status()).toBe(401);
    expect((await resBad.json()).error).toContain('signature verification failed');
  });

  // TC-AUTH-API-03: Viewer cannot create candidates via API
  test('TC-AUTH-API-03: should return 403 when Viewer tries to create a candidate', async ({ request }) => {
    const token = await getAuthToken(request, 'Viewer');

    const res = await request.post('/api/candidates', {
      headers: {
        'Cookie': `sb-access-token=${token}`
      },
      data: {
        name: 'Should Not Create',
        email: 'forbidden@example.com',
        status: 'Applied'
      }
    });
    expect(res.status()).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Forbidden');
  });

  // TC-APPLY-API-01: Public apply endpoint validates missing name
  test('TC-APPLY-API-01: should return 400 for public apply with missing name', async ({ request }) => {
    const res = await request.post('/api/apply', {
      data: {
        email: 'test@example.com'
      }
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('Name is required');
  });

  // TC-APPLY-API-02: Public apply endpoint validates invalid email
  test('TC-APPLY-API-02: should return 400 for public apply with invalid email', async ({ request }) => {
    const res = await request.post('/api/apply', {
      data: {
        name: 'Test Applicant',
        email: 'not-a-valid-email'
      }
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('Valid email is required');
  });

  // TC-APPLY-API-03: Public apply endpoint creates candidate successfully
  test('TC-APPLY-API-03: should return 201 for valid public application', async ({ request }) => {
    const res = await request.post('/api/apply', {
      data: {
        name: 'API Test Applicant',
        email: 'api.test@example.com',
        phone: '+1 (555) 000-0000'
      }
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('API Test Applicant');
    expect(data.email).toBe('api.test@example.com');
    expect(data.status).toBe('Applied');
  });

  // TC-CAND-API-02: Authenticated user can retrieve candidate list
  test('TC-CAND-API-02: should return 200 with candidate list for authenticated user', async ({ request }) => {
    const token = await getAuthToken(request, 'Viewer');

    const res = await request.get('/api/candidates', {
      headers: {
        'Cookie': `sb-access-token=${token}`
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(8); // 8 seeded candidates
  });

  // TC-CAND-API-03: Authenticated Recruiter can create a candidate via API
  test('TC-CAND-API-03: should return 201 when Recruiter creates a candidate via API', async ({ request }) => {
    const token = await getAuthToken(request, 'Recruiter');

    const res = await request.post('/api/candidates', {
      headers: {
        'Cookie': `sb-access-token=${token}`
      },
      data: {
        name: 'API Created Candidate',
        email: 'api.created@example.com',
        phone: '+1 (555) 111-2222',
        status: 'Applied'
      }
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('API Created Candidate');
    expect(data.status).toBe('Applied');
    expect(data.id).toBeTruthy();
  });

  // TC-CAND-API-04: Update endpoint validates empty name
  test('TC-CAND-API-04: should return 400 when updating candidate with empty name', async ({ request }) => {
    const token = await getAuthToken(request, 'Recruiter');
    const candId = 'c1111111-1111-1111-1111-111111111111';

    const res = await request.put(`/api/candidates/${candId}`, {
      headers: {
        'Cookie': `sb-access-token=${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: '   '
      }
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain('Name');
  });
});

