const request = require('supertest');
const app = require('../src/server');
const { sequelize, connectDB } = require('../src/config/database');
const { User, Otp } = require('../src/models');

beforeAll(async () => {
  await connectDB();
  // Disable FK checks, truncate, re-enable
  if (sequelize.getDialect() === 'mysql') {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  } else if (sequelize.getDialect() === 'sqlite') {
    await sequelize.query('PRAGMA foreign_keys = OFF');
  }
  
  await User.destroy({ where: {}, truncate: true });
  await Otp.destroy({ where: {}, truncate: true });
  
  if (sequelize.getDialect() === 'mysql') {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } else if (sequelize.getDialect() === 'sqlite') {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }

  await User.create({
    name: 'Test Admin',
    email: 'testadmin@tms.com',
    password: 'Admin@1234',
    role: 'Admin',
    mustResetPassword: false,
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Endpoints', () => {
  let mathRandomSpy;

  beforeEach(() => {
    // Clean Otp table before each test to prevent rate limit bleeding
    return Otp.destroy({ where: {}, truncate: true });
  });

  afterEach(() => {
    if (mathRandomSpy) {
      mathRandomSpy.mockRestore();
    }
  });

  test('POST /api/auth/login - success triggers 2FA code generation', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('2FA code sent successfully');
    expect(res.body.email).toBe('testadmin@tms.com');
  });

  test('POST /api/auth/login - fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'WrongPass1' });

    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  test('POST /api/auth/login - fails with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Admin@1234' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  test('POST /api/auth/2fa/verify - success with valid code', async () => {
    // Mock Math.random to get a deterministic code: 199999
    mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.111111);

    // Request code
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });

    // Verify code
    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ email: 'testadmin@tms.com', code: '199999' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('testadmin@tms.com');
  });

  test('POST /api/auth/2fa/verify - fails with wrong code', async () => {
    mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.111111);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });

    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ email: 'testadmin@tms.com', code: '000000' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_OTP');
  });

  test('POST /api/auth/2fa/verify - invalidates code after 5 attempts', async () => {
    mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.111111);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });

    // Fail 4 times
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/auth/2fa/verify')
        .send({ email: 'testadmin@tms.com', code: '000000' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_OTP');
    }

    // 5th attempt - should fail and invalidate/destroy code
    const res5 = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ email: 'testadmin@tms.com', code: '000000' });
    expect(res5.statusCode).toBe(400);
    expect(res5.body.errorCode).toBe('MAX_ATTEMPTS');

    // 6th attempt or trying correct code now should fail as it was destroyed
    const res6 = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ email: 'testadmin@tms.com', code: '199999' });
    expect(res6.statusCode).toBe(400);
    expect(res6.body.errorCode).toBe('INVALID_OTP');
  });

  test('GET /api/auth/me - requires authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('NO_TOKEN');
  });

  test('GET /api/auth/me - returns user with valid token', async () => {
    mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.111111);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });

    const verify = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ email: 'testadmin@tms.com', code: '199999' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${verify.body.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('testadmin@tms.com');
  });

  test('POST /api/auth/login - rate limits to max 3 code requests per 15 minutes', async () => {
    // 1st request
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });
    expect(res1.statusCode).toBe(200);

    // 2nd request
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });
    expect(res2.statusCode).toBe(200);

    // 3rd request
    const res3 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });
    expect(res3.statusCode).toBe(200);

    // 4th request - should be blocked
    const res4 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@tms.com', password: 'Admin@1234' });
    expect(res4.statusCode).toBe(429);
    expect(res4.body.errorCode).toBe('RATE_LIMIT');
  });
});
