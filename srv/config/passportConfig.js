const LocalStrategy = require('passport-local').Strategy
const bcryptjs = require('bcryptjs');

function initialize({ passport, client }, getUserByLogin, getUserById) {
    const authenticateUser = async (username, password, done) => {

        const res = await client.query(`SELECT id, username, password FROM users WHERE username = '${username}'`);
        const user = (res.rows.length !== 0) ? res.rows[0] :null;
        //console.log('authenticateUser', user);

        if (user == null) {
            return done(null, false)
        }
        try {
            if (await bcryptjs.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false)
            }
        } catch (e) {
            return done(e)
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => {
        //console.log('serializeUser', user);
        return done(null, user.id) });
    passport.deserializeUser(async (id, done) => {
        const res = await client.query(`SELECT id, username, password, admin FROM users WHERE id = ${id}`);
        const user = (res.rows.length !== 0) ? res.rows[0] : null;
        //console.log('deserializeUser', user);
        return done(null, user);
    });
}

module.exports.initializePassport = initialize
