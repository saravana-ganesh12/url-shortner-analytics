import pool from '../config/database.js';

//Perform query execution in postgresql for analytics
const getAnalyticsFromLogs = async (query, params) => {

    const client = await pool.connect();
    try {
        const response = await client.query(query, params);
        return response.rows;
    }
    catch(err) {
        console.error(err);
        return { errorMessage: 'Analytics request failed' };
    }
    finally {
        client.release();
    }
};

export default getAnalyticsFromLogs;