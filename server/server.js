const jdb = require('../packages/Jdb@v2/jdb');
const validate = require('../packages/mValid/validate.js');
const http = require('http').createServer()
const fs = require('fs')
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const sha256 = require('js-sha256');

//db format -> 1. username 1. [email, password] 1. etc

const unverifiedUsers = {}; // { mail: username, pass, otp, socket.id } -> info of users to be verified

io.on('connection', socket => {
    socket.on('login', data => { // user logs in
        let username = data.username
        let password = data.password
        let allUsers = Object.values(jdb.getEl('data', 'user')) // get all the usernames

        if (allUsers.includes(username)) { // if username exists
            let user = JSON.parse(jdb.getR('data', 'moral', ['user', username])['userinfo']); // get user info [email, password]
            user.push(username) // add username to userinfo

            let checkPass = sha256(password) // password entered by user
            if (checkPass === user[1]) socket.emit('sign-log-success', 'login', user) // if password is correct
            else socket.emit('sign-log-error', 'login', 'No such user or wrong password')

        } else socket.emit('sign-log-error', 'login', 'No such user or wrong password')
    })

    socket.on('register', data => { // when users registers
        let username = data.username
        let password = sha256(data.password)
        let mail = data.mail

        let allUsernames = Object.values(jdb.getEl('data', 'user')) // get all the usernames
        let allMails = Object.values(jdb.getEl('data', 'userinfo')) // get mails of all the users [email, password]

        allMails.shift(); allUsernames.shift(); // remove first element of both arrays (element id)
        allMails.forEach((detail, index) => { // extract mail from the data
            allMails[index] = JSON.parse(detail)[0]
        })

        // check if username is already registered
        if (allUsernames.includes(username)) socket.emit('sign-log-error', 'register', 'Username already registered')
        else {
            // check if mail is already registered
            if (allMails.includes(mail)) socket.emit('sign-log-error', 'register', 'Mail already registered')
            else {
                // check the format of the mail
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                let mailValid = re.test(String(mail).toLowerCase())

                if (mailValid) {
                    // create object to send mail (required by validate.sendMail)
                    let mailObj = {
                        'mail': mail,
                        'username': username,
                        'password': password,
                        'socket': socket
                    }

                    if (Object.keys(unverifiedUsers).includes(mail)) socket.emit('sign-log-error', 'register', 'Mail being registered') // mail is being registered, err
                    else _sendOtp(mailObj, 'register') // send otp to mail

                } else socket.emit('sign-log-error', 'register', 'Invalid mail')
            }
        }
    });

    socket.on('otp-timeout', mail => { // otp timeout
        // delete the user from unverifiedUsers
        Object.keys(unverifiedUsers).includes(mail) ? delete unverifiedUsers[mail] : null
    })

    socket.on('verify-otp', async data => { // user verifies otp
        let mail = data[0]
        let otp = data[1]
        if (Object.keys(unverifiedUsers).includes(mail)) { // if mail is being registered, true
            if (otp === unverifiedUsers[mail][2]) { // if otp is correct
                let user = unverifiedUsers[mail][0]
                let password = unverifiedUsers[mail][1]
                let email = mail

                let moralObject = {
                    'user': user,
                    'userinfo': [email, password]
                }
                socket.emit('sign-log-success', 'register')
                await jdb.assignR('data', moralObject) // assign user to database if verified
                delete unverifiedUsers[mail]

            } else socket.emit('otp-err', 'inv', 'Invalid otp')
        } else socket.emit('otp-err', 'exp', 'Otp expired')
    });

    socket.on('disconnect', () => { // user disconnects
        Object.keys(unverifiedUsers).forEach(mail => {
            if (unverifiedUsers[mail][3] === socket.id) {
                delete unverifiedUsers[mail] // remove the user from unverifiedUsers, if there
            }
        })
    })
});



function _sendOtp(data, type) { // send otp to mail
    if (type === 'register') {
        let mail = data['mail']
        let username = data['username']
        let password = data['password']
        let socket = data['socket']
        validate.sendMail(mail, otpData => {
            if (!otpData[0]) socket.emit('sign-log-error', 'register', 'Invalid mail')
            else {
                unverifiedUsers[mail] = [username, password, otpData[1], socket.id] // add user to unverifiedUsers
                socket.emit('otp-sent-verify', mail) // notify the client, otp sent!
            }
        })
    }
}



http.listen(6969, () => { console.log('listening on port:6969') })