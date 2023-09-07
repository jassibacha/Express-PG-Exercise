/** Routes for companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{invoices: [{id, comp_code}, ...]}` */
router.get('/', async function (req, res, next) {
    try {
        const results = await db.query('SELECT id, comp_code FROM invoices');
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

/** GET /id - 404 if not found - returns `{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}` */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(
            'SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON i.comp_code = c.code WHERE i.id = $1',
            [id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }

        const data = results.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.code,
                name: data.name,
                description: data.description,
            },
        };
        return res.send({ invoice });
    } catch (e) {
        return next(e);
    }
});

/** POST / - Adds an invoice w/ JSON {comp_code, amt} - returns `{{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(
            'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

/** PATCH /id - Updates an invoice. 404 if empty. JSON {amt} - returns `{{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const results = await db.query(
            'UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date',
            [amt, id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `Can't update invoice with id of ${id}`,
                404
            );
        }
        return res.send({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

/** DELETE /id */
router.delete('/:id', async (req, res, next) => {
    try {
        const results = db.query('DELETE FROM invoices WHERE id = $1', [
            req.params.id,
        ]);
        return res.send({ status: 'deleted' });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
