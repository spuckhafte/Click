const jdb = require('../packages/Jdb/jdb.js');
const validate = require('../packages/mValid/validate.js');
const http = require('http').createServer()
const fs = require('fs')
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const sha256 = require('js-sha256');
const { assert } = require('console');
//db format -> "username": ["password", "email", ...]

const unverifiedUsers = {}; // { mail: username, pass, otp, socket.id }

io.on('connection', socket => {
    socket.on('login', data => { // when users logs in
        let username = data.username
        let password = data.password
        jdb.assignI('data', 'users', { 'test': '123' })
        let allUsers = Object.keys(jdb.__getIEl('data', 'users')) // get all users from iElement
        if (allUsers.includes(username)) {
            let user = jdb.__getIEl('data', 'users')[username]
            user.push(username)
            let checkPass = sha256(password)
            if (checkPass === user[0]) {
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
        let password = sha256(data.password)
        let mail = data.mail
        let allUsers = Object.keys(jdb.__getIEl('data', 'users')) // get all users from iElement
        if (allUsers.includes(username)) { // check if username is already taken
            socket.emit('sign-log-error', 'register', 'Username already registered')
        } else {
            let allMails = []
            Object.keys(jdb.__getIEl('data', 'users')).forEach(user => {
                user !== "0" ? allMails.push(jdb.__getIEl('data', 'users')[user][1]) : null
            })
            if (allMails.includes(mail)) { // check if mail is already registered
                socket.emit('sign-log-error', 'register', 'Mail already registered')
            } else {
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                let mailValid = re.test(String(mail).toLowerCase())
                if (mailValid) {
                    let mailObj = {
                        'mail': mail,
                        'username': username,
                        'password': password,
                        'socket': socket
                    }
                    if (Object.keys(unverifiedUsers).includes(mail)) {
                        socket.emit('sign-log-error', 'register', 'Mail being registered')
                    } else _sendOtp(mailObj, 'register')
                }
                else socket.emit('sign-log-error', 'register', 'Invalid mail')

                // now if user is verified, then add user to db
            }
        }
    });

    socket.on('otp-timeout', mail => {
        Object.keys(unverifiedUsers).includes(mail) ? delete unverifiedUsers[mail] : null
    })

    socket.on('verify-otp', data => {
        let mail = data[0]
        let otp = data[1]
        if (Object.keys(unverifiedUsers).includes(mail)) {
            if (otp === unverifiedUsers[mail][2]) {
                let user = unverifiedUsers[mail][0]
                let password = unverifiedUsers[mail][1]

                let userObj = {}
                userObj[user] = [password, mail]
                socket.emit('sign-log-success', 'register', userObj)
                jdb.assignI('data', 'users', userObj)

                delete unverifiedUsers[mail]
            } else {
                socket.emit('otp-err', 'inv', 'Invalid otp')
            }
        } else {
            socket.emit('otp-err', 'exp', 'Otp expired')
        };
    });

    socket.on('disconnect', () => {
        Object.keys(unverifiedUsers).forEach(mail => {
            if (unverifiedUsers[mail][3] === socket.id) {
                delete unverifiedUsers[mail]
            }
        })
    })
});



function _sendOtp(data, type) {
    if (type === 'register') {
        let mail = data['mail']
        let username = data['username']
        let password = data['password']
        let socket = data['socket']
        validate.sendMail(mail, otpData => {
            if (!otpData[0]) socket.emit('sign-log-error', 'register', 'Invalid mail')
            else {
                unverifiedUsers[mail] = [username, password, otpData[1], socket.id]
                socket.emit('otp-sent-verify', mail)
            }
        })
    }
}



http.listen(6969, () => { console.log('listening on port:6969') })