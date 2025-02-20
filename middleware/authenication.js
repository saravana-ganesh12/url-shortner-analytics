import jwt from 'jsonwebtoken';

//Verify JWT
function verifyJwt  (req, res, next){
    const token = req.cookies.auth;
    if(!token) {
        return res.status(403).send('Access denied!');
    }
    //Verfify JSON Web Token and decode.
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            return res.status(403).send('Invalid JWT - Access denied');
        }
        req.user = decoded;
        next();
    });
}



export default verifyJwt;