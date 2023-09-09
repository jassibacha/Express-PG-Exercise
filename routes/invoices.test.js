// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;
let testCompany;
beforeEach(async () => {
    const companyResult = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('yahoo', 'Yahoo', 'Kinda dead.') RETURNING  code, name, description`
    );
    const result = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) VALUES ('yahoo', 400, True, '2023-09-06', '2023-09-06') RETURNING id, comp_code, amt, paid, add_date, paid_date`
    );
    testInvoice = result.rows[0];
    testCompany = companyResult.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /invoices', () => {
    test('Get a list with one invoice', async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoices: [
                { id: testInvoice.id, comp_code: testInvoice.comp_code },
            ],
        });
    });
});

describe('GET /invoices/:id', () => {
    test('Gets a single invoice (w/ company)', async () => {
        // Add an invoice in.
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        //testCompany.invoices = [expect.any(Number)];
        const expectedInvoice = {
            id: expect.any(Number),
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            add_date: '2023-09-06T07:00:00.000Z',
            paid_date: '2023-09-06T07:00:00.000Z',
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: testCompany.description,
            },
        };
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoice: expectedInvoice });
    });
    test('Responds with 404 for invalid code', async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /invoices', () => {
    test('Creates a single invoice', async () => {
        const res = await request(app).post('/invoices').send({
            comp_code: testInvoice.comp_code,
            amt: 200,
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: testInvoice.comp_code,
                amt: 200,
                paid: false,
                add_date: expect.any(String), // This will be current date, changes daily
                paid_date: null,
            },
        });
    });
});

describe('PUT /invoices/:id', () => {
    test('Updates a single invoice already paid', async () => {
        const res = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({ amt: 750, paid: true });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                // id, comp_code, amt, paid, add_date, paid_date
                id: expect.any(Number),
                comp_code: testInvoice.comp_code,
                amt: 750,
                paid: testInvoice.paid,
                add_date: '2023-09-06T07:00:00.000Z',
                paid_date: expect.any(String),
            },
        });
    });
    test('Updates a single invoice mark unpaid', async () => {
        const res = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({ amt: 750, paid: false });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                // id, comp_code, amt, paid, add_date, paid_date
                id: expect.any(Number),
                comp_code: testInvoice.comp_code,
                amt: 750,
                paid: false,
                add_date: '2023-09-06T07:00:00.000Z',
                paid_date: null,
            },
        });
    });
    test('Responds with 404 for invalid id', async () => {
        const res = await request(app).put(`/invoices/0`).send({ amt: 750 });
        expect(res.statusCode).toBe(404);
    });
});

describe('DELETE /invoices/:id', () => {
    test('Deletes a single invoice', async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' });
    });
});
