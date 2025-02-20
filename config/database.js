import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

//Create pool to connect to postgresql
const pool = new pg.Pool({
    user: process.env.PGSQL_USER,
    password: process.env.PGSQL_PASSWORD,
    host: process.env.PGSQL_HOST,
    port: Number(process.env.PGSQL_PORT),
    database: process.env.PGSQL_DATABASE
});

export default pool;