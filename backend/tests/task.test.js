const request = require('supertest');
const app = require('../src/server');
const { sequelize, connectDB } = require('../src/config/database');
const { User, Task } = require('../src/models');

let adminToken, pmToken, collaboratorToken, collaboratorId;

beforeAll(async () => {
  await connectDB();

  // Disable FK checks so we can truncate in any order
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await Task.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@1234', role: 'Admin', mustResetPassword: false });
  await User.create({ name: 'PM', email: 'pm@test.com', password: 'Pm@12345', role: 'Project Manager', mustResetPassword: false });
  const collaborator = await User.create({ name: 'Collab', email: 'collab@test.com', password: 'Collab@123', role: 'Collaborator', mustResetPassword: false });
  collaboratorId = collaborator.id;

  const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.111111);

  await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
  const adminVerify = await request(app).post('/api/auth/2fa/verify').send({ email: 'admin@test.com', code: '199999' });
  adminToken = adminVerify.body.accessToken;

  await request(app).post('/api/auth/login').send({ email: 'pm@test.com', password: 'Pm@12345' });
  const pmVerify = await request(app).post('/api/auth/2fa/verify').send({ email: 'pm@test.com', code: '199999' });
  pmToken = pmVerify.body.accessToken;

  await request(app).post('/api/auth/login').send({ email: 'collab@test.com', password: 'Collab@123' });
  const collabVerify = await request(app).post('/api/auth/2fa/verify').send({ email: 'collab@test.com', code: '199999' });
  collaboratorToken = collabVerify.body.accessToken;

  randomSpy.mockRestore();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Task Endpoints', () => {
  let taskId;

  test('PM can create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Test Task', priority: 'High', assignedTo: collaboratorId, dueDate: '2030-01-01' });

    expect(res.statusCode).toBe(201);
    expect(res.body.task.title).toBe('Test Task');
    taskId = res.body.task.id;
  });

  test('Collaborator cannot create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${collaboratorToken}`)
      .send({ title: 'Should Fail' });

    expect(res.statusCode).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  test('Task creation fails without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ description: 'No title here' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  test('Task creation fails with past due date', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Past Due Task', dueDate: '2020-01-01' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  test('Collaborator can view their assigned task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${collaboratorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.task.id).toBe(taskId);
  });

  test('Collaborator can update status of their task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${collaboratorToken}`)
      .send({ status: 'In Progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.task.status).toBe('In Progress');
  });

  test('Collaborator cannot delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${collaboratorToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Admin can delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
  });
});
