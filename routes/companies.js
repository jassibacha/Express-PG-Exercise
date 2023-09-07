/** Routes for companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

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
        const compResults = await db.query(
            'SELECT * FROM companies WHERE code = $1',
            [code]
        );
        const invResults = await db.query(
            'SELECT * FROM invoices WHERE comp_code = $1',
            [code]
        );
        if (compResults.rows.length === 0) {
            throw new ExpressError(
                `Can't find company with code of ${code}`,
                404
            );
        }

        const company = compResults.rows[0];
        const invoices = invResults.rows;
        company.invoices = invoices.map((inv) => inv.id);
        return res.send({ company: company });
    } catch (e) {
        return next(e);
    }
});

/** POST / - Adds a company with JSON submitted - returns `{company: {code, name, description}}` */
router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
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
