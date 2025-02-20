import express from "express";

//Import for middleware functions
import rateLimiting from '../middleware/rateLimiting.js';
import authentication from '../middleware/authenication.js';

//Utility function for fetching logs for analytics
import getAnalyticsFromLogs from '../utils/getAnalyticsFromLogs.js';

const router = express.Router();

//Middleware for Rate limiting and authentication
router.use(rateLimiting);
router.use(authentication);

//GET call (/api/analytics/{alias}) route to get analytics for alias 
router.get('/:alias', async (req, res, next) => {
    if(req.params.alias === 'overall') {
      next();
    }
    else {
      const userId = req.user.userId;
      const alias = req.params.alias;
  
      const totalClicksQuery = 'SELECT COUNT(*) as totalClicks FROM logs WHERE alias = $1 AND user_id = $2';
  
      const uniqueUsersQuery = 'SELECT COUNT(DISTINCT ip) as uniqueUsers FROM logs WHERE alias = $1 AND user_id = $2';
  
      const clicksByDateQuery = `
      SELECT date_trunc('day', timestamp) as date, COUNT(*) as clicks
      FROM logs WHERE alias = $1 AND user_id = $2
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7`;
  
      const osTypeQuery = `
      SELECT os as osName, COUNT(*) as uniqueClicks, COUNT(DISTINCT ip) as uniqueUsers
      FROM logs WHERE alias = $1 AND user_id = $2
      GROUP BY os`;
  
      const deviceTypeQuery = `
      SELECT device as deviceName, COUNT(*) as uniqueClicks, COUNT(DISTINCT ip) as uniqueUsers
      FROM logs WHERE alias = $1 AND user_id = $2
      GROUP BY device`;
  
      try {
          const [totalClicks, uniqueUsers, clicksByDate, osType, deviceType] = await Promise.all([
            getAnalyticsFromLogs(totalClicksQuery, [alias, userId]),
            getAnalyticsFromLogs(uniqueUsersQuery, [alias, userId]),
            getAnalyticsFromLogs(clicksByDateQuery, [alias, userId]),
            getAnalyticsFromLogs(osTypeQuery, [alias, userId]),
            getAnalyticsFromLogs(deviceTypeQuery, [alias, userId]),
          ]);
      
          res.json({
            totalClicks: totalClicks[0].totalclicks,
            uniqueUsers: uniqueUsers[0].uniqueusers,
            clicksByDate,
            osType,
            deviceType,
          });
        } catch (error) {
          res.status(500).json({ errorMessage: 'Request failed' });
        }  
    }
});

//GET call (/api/analytics/topic/{topic}) route to get analytics for topic 
router.get('/topic/:topic', async (req, res) => {

    const userId = req.user.userId;
    const topic = req.params.topic;
  
    const totalClicksQuery = 'SELECT COUNT(*) as totalClicks FROM logs WHERE topic = $1 AND user_id = $2';

    const uniqueUsersQuery = 'SELECT COUNT(DISTINCT ip) as uniqueUsers FROM logs WHERE topic = $1 AND user_id = $2';

    const clicksByDateQuery = `
      SELECT date_trunc('day', timestamp) as date, COUNT(*) as clicks
      FROM logs WHERE topic = $1 AND user_id = $2
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7`;

    const urlsQuery = `
      SELECT alias as shortUrl, COUNT(*) as totalClicks, COUNT(DISTINCT ip) as uniqueUsers
      FROM logs WHERE topic = $1 AND user_id = $2
      GROUP BY alias`;
  
    try {
      const [totalClicks, uniqueUsers, clicksByDate, urls] = await Promise.all([
        getAnalyticsFromLogs(totalClicksQuery, [topic, userId]),
        getAnalyticsFromLogs(uniqueUsersQuery, [topic, userId]),
        getAnalyticsFromLogs(clicksByDateQuery, [topic, userId]),
        getAnalyticsFromLogs(urlsQuery, [topic, userId]),
      ]);
  
      res.json({
        totalClicks: totalClicks[0].totalclicks,
        uniqueUsers: uniqueUsers[0].uniqueusers,
        clicksByDate,
        urls,
      });
    } catch (error) {
      res.status(500).json({ errorMessage: 'Request failed' });
    }
});


//GET call (/api/analytics/overall) route to get overall analytics 
router.get('/overall', async (req, res) => {

    const totalUrlsQuery = 'SELECT COUNT(DISTINCT alias) as totalUrls FROM logs';

    const totalClicksQuery = 'SELECT COUNT(*) as totalClicks FROM logs';

    const uniqueUsersQuery = 'SELECT COUNT(DISTINCT ip) as uniqueUsers FROM logs';

    const clicksByDateQuery = `
      SELECT date_trunc('day', timestamp) as date, COUNT(*) as clicks
      FROM logs
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7`;

    const osTypeQuery = `
      SELECT os as osName, COUNT(*) as uniqueClicks, COUNT(DISTINCT ip) as uniqueUsers
      FROM logs
      GROUP BY os`;

    const deviceTypeQuery = `
      SELECT device as deviceName, COUNT(*) as uniqueClicks, COUNT(DISTINCT ip) as uniqueUsers
      FROM logs
      GROUP BY device`;
  
    try {
      const [totalUrls, totalClicks, uniqueUsers, clicksByDate, osType, deviceType] = await Promise.all([
        getAnalyticsFromLogs(totalUrlsQuery, []),
        getAnalyticsFromLogs(totalClicksQuery, []),
        getAnalyticsFromLogs(uniqueUsersQuery, []),
        getAnalyticsFromLogs(clicksByDateQuery, []),
        getAnalyticsFromLogs(osTypeQuery, []),
        getAnalyticsFromLogs(deviceTypeQuery, []),
      ]);

      res.json({
        totalUrls: totalUrls[0].totalurls,
        totalClicks: totalClicks[0].totalclicks,
        uniqueUsers: uniqueUsers[0].uniqueusers,
        clicksByDate,
        osType,
        deviceType,
      });
    } catch (error) {
      res.status(500).json({ errorMessage: 'Request failed' });
    }
});


export default router;