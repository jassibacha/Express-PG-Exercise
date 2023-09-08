/** Routes for companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{invoices: [{id, comp_code}, ...]}` */
router.get('/', async function (req, res, next) {
    try {
        const results = await db.query('SELECT code, industry FROM industries');
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
