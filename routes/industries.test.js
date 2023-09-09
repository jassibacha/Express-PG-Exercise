// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
    const cResult = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('yahoo', 'Yahoo', 'Kinda dead.') RETURNING  code, name, description`
    );
    //testCompany = cResult.rows[0];

    const iResult = await db.query(
        `INSERT INTO industries (code, industry) VALUES ('tech', 'Technology'), ('sports', 'Sports')`
    );
    //testIndustry = iResult.rows[0];

    const ciResult = await db.query(
        `INSERT INTO companies_industries (company_code, industry_code) VALUES ('yahoo', 'tech')`
    );
    //testConnect = ciResult.rows[0];
});

afterEach(async () => {
    // Delete data from related tables first to avoid foreign key constraints
    await db.query(`DELETE FROM companies_industries`);

    // Then, delete data from the industries and companies tables
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM industries`);
});

afterAll(async () => {
    await db.end();
});

describe('GET /industries', () => {
    test('Gets a list of industries with associated companies', async () => {
        const res = await request(app).get('/industries');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            industries: [
                {
                    code: 'tech', // Replace with the actual industry code
                    industry: 'Technology', // Replace with the actual industry name
                    companies: ['yahoo'], // Replace with the actual company code(s)
                },
                {
                    code: 'sports', // Replace with the actual industry code
                    industry: 'Sports', // Replace with the actual industry name
                    companies: [null], // Replace with the actual company code(s)
                },
            ],
        });
    });
});

describe('POST /industries', () => {
    test('Creates a new industry', async () => {
        const newIndustry = {
            code: 'new-industry', // Replace with the desired industry code
            industry: 'New Industry', // Replace with the desired industry name
        };

        const res = await request(app).post('/industries').send(newIndustry);

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            industry: newIndustry,
        });
    });
});

describe('POST /industries/join', () => {
    test('Joins a company and industry together', async () => {
        const joinData = {
            company_code: 'yahoo', // Replace with the actual company code
            industry_code: 'sports', // Replace with the actual industry code
        };

        const res = await request(app).post('/industries/join').send(joinData);

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            joined: joinData,
        });
    });
});
