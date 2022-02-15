const jdb = require('../packages/Jdb/jdb.js');
const validate = require('../packages/mValid/validate.js');
const http = require('http').createServer()
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

//db format -> "username": ["password", "email", ...]

io.on('connection', socket => {

    socket.on('login', data => { // when users logs in
        let username = data.username
        let password = data.password
        let allUsers = Object.keys(jdb.__getIEl('data', 'users')) // get all users from iElement
        if (allUsers.includes(username)) {
            let user = jdb.__getIEl('data', 'users')[username]
            user.push(username)
            if (user[0] === password) {
                socket.emit('sign-log-success', 'login', user)
            } else {
                socket.emit('sign-log-error', 'login', 'No such user or wrong password')
            }
        } else {
            socket.emit('sign-log-error', 'login', 'No such user or wrong password')
        }
    })

    socket.on('register', data => { // when users registers
        let username = data.username
        let password = data.password
        let mail = data.mail
        let allUsers = Object.keys(jdb.__getIEl('data', 'users')) // get all users from iElement
        if (allUsers.includes(username)) { // check if username is already taken
            socket.emit('sign-log-error', 'register', 'Username already registered')
        } else {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            let maleValid = re.test(String(mail).toLowerCase())
            if (maleValid) {
                maleValid = validate.sendMail(mail) // send otp for mail verification
                if (!maleValid) socket.emit('sign-log-error', 'register', 'Invalid mail')
            }
            else socket.emit('sign-log-error', 'register', 'Invalid mail')

            // now if user is verified, then add user to db
        }
    })
});

http.listen(6969, () => { console.log('listening on port:6969') })