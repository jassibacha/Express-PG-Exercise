/** Routes for companies */

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

/** GET / - returns `{companies: [{code, name}, ...]}` */

// router.get('/', async function (req, res, next) {
//     try {
//         const results = await db.query('SELECT code, name FROM companies');
//         return res.json({ companies: results.rows });
//     } catch (err) {
//         return next(err);
//     }
// });

module.exports = router;
