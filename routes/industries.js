/** Routes for companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{invoices: [{id, comp_code}, ...]}` */
router.get('/', async function (req, res, next) {
    try {
        //const results = await db.query('SELECT code, industry FROM industries');
        const results = await db.query(`
            SELECT i.code, i.industry, array_agg(ci.company_code) as companies
            FROM industries AS i
            LEFT JOIN companies_industries AS ci ON i.code = ci.industry_code
            GROUP BY i.code, i.industry
        `);
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

/** POST / - Adds an industry with JSON submitted - returns `{company: {code, name, description}}` */
router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const results = await db.query(
            'INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry',
            [code, industry]
        );
        return res.status(201).json({ industry: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

/** POST /join - Joins a company and industry together many-to-many */
router.post('/join', async (req, res, next) => {
    try {
        const { company_code, industry_code } = req.body;
        const results = await db.query(
            'INSERT INTO companies_industries (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code',
            [company_code, industry_code]
        );
        return res.status(201).json({ joined: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
