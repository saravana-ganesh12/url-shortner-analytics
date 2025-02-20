//Import dependencies packages
import express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

//Import Routes
import authRoute from './routes/apiAuth.js';
import urlShortner from './routes/urlShortner.js';
import apiUrlShortner from './routes/apiUrlShortner.js';
import apiUrlShortnerAnalytics from './routes/apiUrlShortnerAnalytics.js'

//Set path name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Environment variable
dotenv.config();


//Express setup
const app = express();
app.set('view engine', 'ejs');
app.set('views',path.join( __dirname,'views'));
app.use(express.static(path.join(__dirname, 'public')));
    
//Middleware
app.use(cookieParser());
app.use(bodyParser.json());


//Home page
app.get('/',(req, res) => {
    res.render('home',{title: 'Custom URL shortner'})
});

//Authentication route
app.use('/api/auth', authRoute);

//Url shortner application route
app.use('/urlshortner', urlShortner);

//Url shortner API route
app.use('/api/shorten', apiUrlShortner);

//Url shortner analytics route
app.use('/api/analytics', apiUrlShortnerAnalytics);

//Listen for request
app.listen(process.env.PORT, () => {
    console.log('Server started...');
})



