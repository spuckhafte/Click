const nodemailer = require('nodemailer');
const otpgenerator = require('otp-generator')
const details = require('./details.js')
const readline = require('readline');

const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
function sendMail(to, retFn) {
    const user = details.user;
    const pass = details.pass;
    const sub = '\"Click\" Validation';
    let otp = otpgenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });
    const msg = 'Your OTP is: ' + otp
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: user,
            pass: pass
        }
    })
    const email = {
        from: user,
        to: to,
        subject: sub,
        text: msg
    }
    transporter.sendMail(email, (err, info) => {
        if (err) {
            console.log('\x1b[31m' + err + '\x1b[0m')
            retFn([false])
        } else {
            console.log(`\x1b[32mMail sent: \x1b[35m${user} \x1b[33m-> \x1b[35m${to}\x1b[0m`)
            retFn([true, otp])
        }
    })
}

module.exports = { sendMail }