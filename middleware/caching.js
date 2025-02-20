import { client } from '../config/cacheDatabase.js';
import logging from './logging.js';


//Get value from key for Cached Long URL in Redis Cache Database
const getCache = async (req, res, next) => {
    let cacheValue;
    try {
        const cacheKey = `redisKey_${req.params.alias}`;
        await client.connect();
        cacheValue = await client.get(cacheKey);
        await client.disconnect();

        if(cacheValue) {
            res.redirect(cacheValue);
        }
        else{
            next();
        }        
    }
    catch(err) {
        console.error(err);
    }
    finally {
        if(cacheValue) {
            logging(req, res);
        }
    }
};


//Set value to key for long URL in Redis Cache Database
const setCache = async (req, res, next) => {
    
    try {
        const cacheKey = `redisKey_${req.params.alias}`;
        const cacheValue = res.longURL;

        await client.connect();
        await client.set(cacheKey, cacheValue, 'EX',3600);
        await client.disconnect();

        next();
    }
    catch (err) {
        console.error(err);
    }

}

export  { getCache, setCache };

