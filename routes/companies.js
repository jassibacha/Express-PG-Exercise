/** Routes for companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const slugify = require('slugify');

/** GET / - returns `{companies: [{code, name}, ...]}` */

router.get('/', async function (req, res, next) {
    try {
        const results = await db.query('SELECT code, name FROM companies');
        return res.json({ companies: results.rows });
    } catch (err) {
        return next(err);
    }
});

/** GET /code -  404 if not found - returns `{company: {code, name, description}}` */
router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;

        const results = await db.query(
            `SELECT c.*, i.*
            FROM companies AS c
            LEFT JOIN invoices AS i ON c.code = i.comp_code
            WHERE c.code = $1`,
            [code]
        );

        const indResults = await db.query(
            `SELECT c.*, ind.*, ci.*
            FROM companies AS c
            LEFT JOIN companies_industries AS ci ON c.code = ci.company_code
            LEFT JOIN industries AS ind ON ci.industry_code = ind.code
            WHERE c.code = $1`,
            [code]
        );

        if (compResults.rows.length === 0) {
            throw new ExpressError(
                `Can't find company with code of ${code}`,
                404
            );
        }

        const company = results.rows[0];
        company.invoices = results.rows.map((inv) => inv.id);
        company.industries = indResults.rows.map((ind) => ind.industry);

        const output = {
            code: company.code,
            name: company.name,
            description: company.description,
            industries: company.industries,
            invoices: company.invoices,
        };
        return res.send({ company: output });
    } catch (e) {
        return next(e);
    }
});

/** POST / - Adds a company with JSON submitted - returns `{company: {code, name, description}}` */
router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, {
            lower: true, // convert to lower case, defaults to `false`
            strict: true, // strip special characters except replacement, defaults to `false`
        });
        const results = await db.query(
            'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
            [code, name, description]
        );
        return res.status(201).json({ company: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

/** PATCH /code - Edit existing company. 404 if not found. - returns `{company: {code, name, description}}` */
router.patch('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(
            'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
            [name, description, code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `Can't update company with code of ${code}`,
                404
            );
        }
        return res.send({ company: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

/** DELETE /code - Adds a company with JSON submitted - returns `{company: {code, name, description}}` */
router.delete('/:code', async (req, res, next) => {
    try {
        const results = db.query('DELETE FROM companies WHERE code = $1', [
            req.params.code,
        ]);
        return res.send({ status: 'deleted' });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
