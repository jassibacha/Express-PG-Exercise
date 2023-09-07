// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('yahoo', 'Yahoo', 'Kinda dead.') RETURNING  code, name, description`
    );
    testCompany = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /companies', () => {
    test('Get a list with one company', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            companies: [{ code: testCompany.code, name: testCompany.name }],
        });
    });
});

describe('GET /companies/:code', () => {
    test('Gets a single company (no invoices)', async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        testCompany.invoices = []; // empty invoices array
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: testCompany });
    });
    test('Gets a single company (w/ invoice)', async () => {
        // Add an invoice in.
        const invoiceResult = await db.query(
            `INSERT INTO invoices (comp_code, amt, paid) VALUES ('yahoo', 400, True) RETURNING id, comp_code, amt, paid, add_date, paid_date`
        );
        const res = await request(app).get(`/companies/${testCompany.code}`);
        testCompany.invoices = [expect.any(Number)];
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ company: testCompany });

        await db.query(`DELETE FROM invoices`);
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/companies/akjshdf`);
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /companies', () => {
    test('Creates a single company', async () => {
        const res = await request(app).post('/companies').send({
            name: 'IGN Gaming',
            description: 'A website.',
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: {
                code: 'ign-gaming',
                name: 'IGN Gaming',
                description: 'A website.',
            },
        });
    });
});

describe('PATCH /companies/:id', () => {
    test('Updates a single company', async () => {
        const res = await request(app)
            .patch(`/companies/${testCompany.code}`)
            .send({ name: 'IGN Gaming', description: 'A website.' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: testCompany.code,
                name: 'IGN Gaming',
                description: 'A website.',
            },
        });
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app)
            .patch(`/companies/fajskdfhj`)
            .send({ name: 'IGN Gaming', description: 'A website.' });
        expect(res.statusCode).toBe(404);
    });
});

describe('DELETE /companies/:id', () => {
    test('Deletes a single company', async () => {
        const res = await request(app).delete(`/companies/${testCompany.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' });
    });
});
