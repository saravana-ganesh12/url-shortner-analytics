import { createClient } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();

//Create client for connecting to redis cache database
const client = createClient({
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

//On error event, log the error
client.on('error', err => console.error('Redis Client Error', err));


export { client };
