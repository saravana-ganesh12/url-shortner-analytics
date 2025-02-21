import express from 'express';

//For generation UUID for url id
import { v4 as uuidv4 } from 'uuid';

//Import middleware functions
import authentication from '../middleware/authenication.js';
import rateLimiting from '../middleware/rateLimiting.js'
import logging from '../middleware/logging.js';

//Import Postgres and Redis database dependencies 
import pool from '../config/database.js';
import { getCache, setCache } from '../middleware/caching.js';

const router = express.Router();

//Middleware for rate limiting and authentication with JWT
router.use(rateLimiting);
router.use(authentication);

//POST call (/api/shorten) route to create Shorten URL  
router.post('/', async (req, res) => {
    if(!req.body.longURL) {
        res.status(400).json({ errorMessage: 'URL is required'});
    }

    if(req.body.customAlias) {
        try {
            const client = await pool.connect();
            const response = await client.query('SELECT alias FROM url WHERE user_id = $1 AND alias = $2',[req.user.userId, req.body.customAlias])
            if(response.rowCount > 0) {
                client.release();
                res.status(400).json({ errorMessage: 'Custom Alias already exists, please try with new alias'});
                return;
            }
        }
        catch(err) {
            console.error(err);
            res.status(400).json({ errorMessage: 'Request Failed'});
            return;
        }
    }

    try {
        const urlId = uuidv4().slice(0, 8);
        const client = await pool.connect();
        //Insert to url table
        const response = await client.query('INSERT INTO url (user_id, url_id, url_custom_alias, long_url, topic, alias) VALUES ($1, $2, $3, $4, $5, $6) RETURNING created_datetime, url_id',[req.user.userId, urlId,(req.body.customAlias? req.body.customAlias:""), req.body.longURL, (req.body.topic? req.body.topic:""),(req.body.customAlias? req.body.customAlias:urlId)]);
        if(response.rowCount > 0) {
            client.release();
            res.status(200).json({ shortUrl: `https://${req.get('host')}/api/shorten/${(req.body.customAlias)?req.body.customAlias:response.rows[0].url_id}`, createdAt:response.rows[0].created_datetime });
            return;
        }
    }
    catch(err) {
        console.error(err);
        res.status(400).json({ errorMessage: 'Request failed'});
        return;
    }
    
});

//Route to check for cache for long URL in Redis cache database
router.get('/:alias', getCache);

//GET call (/api/shorten/{alias}) route to redirect Shorten URL to long URL
router.get('/:alias', async (req, res,next) => {
    try {
        
        const client = await pool.connect();
        const longUrlId = await client.query(`SELECT long_url,topic FROM url WHERE alias = $1`,[req.params.alias]);
        if(longUrlId.rowCount > 0) {
            res.redirect(longUrlId.rows[0].long_url);
            req.topic = (longUrlId.rows[0].topic)?longUrlId.rows[0].topic:"";
            res.longURL = longUrlId.rows[0].long_url;
            next();
        }
        else {
            res.status(400).json({ errorMessage: 'Redirection alias not found'});
        }
    }
    catch(err) {
        res.status(400).json({ errorMessage: 'Request failed'});
    } 
});

//Route to set long URL cache in Redis cache database
router.get('/:alias', setCache);

//Router
router.get('/:alias', logging);


export default router;