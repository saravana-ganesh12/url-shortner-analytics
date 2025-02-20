import express from 'express';

//Import for JSON Web token package
import jwt from 'jsonwebtoken';

//Import for connection for postgres
import pool from '../config/database.js';

const router = express.Router();

//Google Signin route to redirect to login url
router.get('/signin/google', (req, res)=> {

    const googleClientID = process.env.AUTH_GOOGLE_ID;
    const gooleOAuthURL = process.env.AUTH_GOOGLE_OAUTH_URL;
    const gooleCallBackURL = process.env.AUTH_GOOGLE_CALLBACK_URL;
    const googleOAuthScopes = ["https%3A//www.googleapis.com/auth/userinfo.email", "https%3A//www.googleapis.com/auth/userinfo.profile"];

    const state = "123";
    const scopes = googleOAuthScopes.join(" ");
    res.redirect(`${gooleOAuthURL}?client_id=${googleClientID}&redirect_uri=${gooleCallBackURL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`); 
});

//Get authorization code from google callback url
router.get('/callback/google', async (req, res) => {
    try {
        const googleClientID = process.env.AUTH_GOOGLE_ID;
        const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
        const googleCallbackURL = process.env.AUTH_GOOGLE_CALLBACK_URL;
        const googleAccessTokenURL = process.env.AUTH_GOOGLE_ACCESS_TOKEN_URL;
        const googleTokenInfoURL = process.env.AUTH_GOOGLE_TOKEN_INFO_URL;
    
        const { code } = req.query;
    
        const body =  {
            code,
            client_id: googleClientID,
            client_secret: googleClientSecret,
            redirect_uri: googleCallbackURL,
            grant_type: "authorization_code"
        }
        
        //Get access token from google
        const response = await fetch(googleAccessTokenURL, {
            method:"POST",
            body: JSON.stringify(body),
        });
    
        const accesTokenData = await response.json();
    
        const { id_token } = accesTokenData;
    
        //Get token information (username and email id)
        const tokenInfoResponse = await fetch(`${googleTokenInfoURL}?id_token=${id_token}`);
        const tokenInfoData = await tokenInfoResponse.json();
    
        const { email } = tokenInfoData;
        const userName = tokenInfoData.given_name;
    
        let userId;
        if(tokenInfoResponse.status === 200) {
            const client = await pool.connect()
            const userExists = await pool.query('SELECT user_id FROM users WHERE email = $1',[email]);
            client.release()
            if(userExists.rowCount === 0) {
                //Insert into users table
                const createUser = await pool.query('INSERT INTO users (name, email, provider) VALUES ($1, $2, $3) RETURNING user_id',[userName, email, 'google']);
                if(createUser.rowCount > 0) {
                    userId = createUser.rows[0].user_id;
                }
            }
            else {
                userId = userExists.rows[0].user_id;
            }

            //Sign JSON Web Token with user id value as payload with 2 days to expire
            const signJwt = jwt.sign({ userId }, process.env.JWT_SECRET,{expiresIn: '2d'});
            res.cookie('auth', signJwt, {httpOnly:true,secure:true });
            res.redirect('/urlshortner/create');
        }
        else {
            res.send('Authentication failed');
        }
    }
    catch(err) {
        console.error(err);
        res.send('Authentication failed');
    }
});

export default router;