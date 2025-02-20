import express from 'express';

//Import node fetch API package
import fetch from 'node-fetch';

//Import JSON Web Token package
import jwt from 'jsonwebtoken';

//Import postgres connection
import pool from '../config/database.js';

//Import dot env package for managing environment variable
import * as dotenv from 'dotenv';
dotenv.config();

//Import authentication middleware
import authentication from '../middleware/authenication.js';

const router = express.Router();

//Middleware - Authentication
router.use(authentication);

//Route for home page for application
router.get('/create', async (req, res) => {

    const userId = req.user.userId;
    const signJwt = jwt.sign({ userId }, process.env.JWT_SECRET,{expiresIn: '2d'});

    try {
        //Fetch Both API in parallel to get alias and topic
        const response = await Promise.all([fetch(`${process.env.HOST}/urlshortner/getalias`,{
            headers:{
                'Cookie':`auth=${signJwt}`
            }
    
        }),fetch(`${process.env.HOST}/urlshortner/gettopic`,{
            headers:{
                'Cookie':`auth=${signJwt}`
            }
        })
        ]);

        const [aliasResponse, topicResponse] = await Promise.all([
            response[0].json(),
            response[1].json()
        ]);

        res.render('createShortURL', {title: 'Create Shorten URL',  alias: aliasResponse.data, topic:topicResponse.data});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ errorMessage: 'Request Failed'});
    }
});

//Route get all alias for specific user
router.get('/getalias', async (req, res) => {
    const client = await pool.connect();
    try {   
        const response = await client.query(`SELECT alias FROM url WHERE user_id = $1`,[req.user.userId]);
        res.status(200).json({data: response.rows});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ errorMessage: 'Request Failed'});
    }
    finally {
        client.release();
    }
});

//Route get all topic for specific user
router.get('/gettopic', async (req, res) => {
    const client = await pool.connect();
    try {   
        const response = await client.query(`SELECT topic FROM url WHERE user_id = $1`,[req.user.userId]);
        res.status(200).json({ data: response.rows});
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ errorMessage: 'Request Failed'});
    }
    finally {
        client.release();
    }
});

export default router;