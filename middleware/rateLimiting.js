import rateLimit from "express-rate-limit";

//Rate limit is set to 100 request per 15 mins
const rateLimiting = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message:'Many request at a time, please try again later'
});

export default rateLimiting;