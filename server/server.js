const jdb = require('../packages/Jdb@v2/jdb');
const validate = require('../packages/mValid/validate.js');
const http = require('http').createServer()
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const sha256 = require('js-sha256');

//db format:
// user -> {0: id, 1: "user22"}
// userabout -> {0: id, 1: [dp, gender, about]}
// userinfo -> {0: id, 1: [mail, password, dob]}
const unverifiedUsers = {}; // { mail: username, pass, otp, socket.id } -> info of users to be verified

io.on('connection', socket => {
    console.log('socket connected');
    socket.on('login', data => { // user logs in
        let username = data.username
        let password = data.password
        let allUsers = Object.values(jdb.getEl('data', 'user')) // get all the usernames

        if (allUsers.includes(username)) { // if username exists
            let userData = {}
            let user = JSON.parse(jdb.getR('data', 'moral', ['user', username])['userinfo']); // get user info [email, password, dob]
            let about = JSON.parse(jdb.getR('data', 'moral', ['user', username])['userabout']); // get user info [avatar, gender, about]

            userData['username'] = username;
            userData['mail'] = user[0];
            userData['password'] = user[1];
            userData['dob'] = user[2];
            userData['avatar'] = about[0];
            userData['gender'] = about[1];
            userData['about'] = about[2];

            userData = JSON.stringify(userData);

            let checkPass = sha256(password) // password entered by user
            if (checkPass === user[1]) socket.emit('sign-log-success', 'login', userData) // if password is correct
            else socket.emit('sign-log-error', 'login', 'No such user or wrong password')

        } else socket.emit('sign-log-error', 'login', 'No such user or wrong password')
    })

    socket.on('register', data => { // when users registers
        let username = data.username
        let password = sha256(data.password)
        let mail = data.mail
        let dob = data.userDob
        let gender = data.userGender;

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
                        'dob': dob,
                        'gender': gender,
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
                let dob = unverifiedUsers[mail][3]
                let gender = unverifiedUsers[mail][4]
                let about = 'none'
                let email = mail

                let moralObject = {
                    'user': user,
                    'userinfo': [email, password, dob],
                    'userabout': [`https://avatars.dicebear.com/api/pixel-art-neutral/:${user}.png`, gender, about]
                }
                socket.emit('sign-log-success', 'register')
                await jdb.assignR('data', moralObject) // assign user to database if verified
                delete unverifiedUsers[mail]

            } else socket.emit('otp-err', 'inv', 'Invalid otp')
        } else socket.emit('otp-err', 'exp', 'Otp expired')
    });

    socket.on('edit-profile', async data => { // user edits profile
        // get user info and edit it and save it in database
        let user = jdb.getR('data', 'moral', ['user', data['username']]);
        let entry = user['entry'];
        delete user['entry'];
        let userinfo = JSON.parse(user['userinfo'])
        let userabout = JSON.parse(user['userabout'])
        userinfo[2] = data['dob']
        userabout[2] = data['about']

        user['userinfo'] = JSON.stringify(userinfo)
        user['userabout'] = JSON.stringify(userabout)
        await jdb.editR('data', entry, user);

        // send updated user info to client
        let userData = {}
        userData['username'] = user['user'];
        userData['mail'] = userinfo[0];
        userData['dob'] = userinfo[2];
        userData['avatar'] = userabout[0];
        userData['gender'] = userabout[1];
        userData['about'] = userabout[2];
        userData = JSON.stringify(userData);
        socket.emit('user-updated', userData); // send it
    });

    socket.on('data-for-homepage', data => { // send data to homepage
        socket.emit('user-data-home', data);
    })

    socket.on('disconnect', () => { // user disconnects
        console.log('socket disconnected');
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
        let dob = data['dob']
        let gender = data['gender']
        let socket = data['socket']
        validate.sendMail(mail, otpData => {
            if (!otpData[0]) socket.emit('sign-log-error', 'register', 'Invalid mail')
            else {
                unverifiedUsers[mail] = [username, password, otpData[1], dob, gender, socket.id] // add user to unverifiedUsers
                socket.emit('otp-sent-verify', mail) // notify the client, otp sent!
            }
        })
    }
}



http.listen(6969, () => { console.log('listening on port:6969') })