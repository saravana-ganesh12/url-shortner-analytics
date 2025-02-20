import geoip from 'geoip-lite';
import pool from '../config/database.js';

//Perform logging on each redirection to long URL
async function logging (req, res) {
    try {
        const userId = req.user.userId;
        const alias = req.params.alias;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip;
        const os = userAgent.match(/\((.*?)\)/) ? userAgent.match(/\((.*?)\)/)[1] : 'Unknown OS';
        const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
        const geoLocation = geoip.lookup(ipAddress) || { city: 'Unknown', region: 'Unknown', country: 'Unknown' };
        let topic = req.topic;
        const client = await pool.connect();
        if(!topic) {
            //Get topic for alias
            const topicResponse = await pool.query(`SELECT topic FROM url WHERE user_id = $1 AND alias = $2`,[userId, alias]);
            if(topicResponse.rowCount > 0) {
                topic = topicResponse.rows[0].topic;
            } 
        }

        //Insert to logs table
        const response = await client.query(`INSERT INTO logs (alias, topic, ip, os, device, geolocation, user_id) VALUES ($1, $2, $3, $4, $5, $6,$7)`,[alias, topic,ipAddress,os,device,`${geoLocation.city}, ${geoLocation.region}, ${geoLocation.country}`,userId]);
        if(response.rowCount === 0) {
            console.warn('Redirection is not logged to DB');
        }
        client.release();
    }
    catch(err) {
        console.warn('Redirection is not logged to DB');
        console.error(err);
    }
}

export default logging;