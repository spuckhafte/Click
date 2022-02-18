const socket = io.connect('http://localhost:6969')
const logUsername = $('#login-name')
const regUsername = $('#register-name')
const logPassword = $('#login-pass')
const regPasssword = $('#register-pass')
const logButton = $('.login-btn')
const registerBtn = $('.sign-btn')
const registerMail = $('#register-mail')

const usermailInVerification = $('#verify-mail')
const verifyOtp = $('#ver-submit-btn')
const resendOtp = $('#resend-otp-btn-')

const changeToLogBtn = $('#log-btn')
const changeToRegBtn = $('#register-btn')

logButton.click(event => {
    event.preventDefault()
    if (logUsername.val().length <= 2 || logPassword.val().length < 8) {
        _showLoginRegisterError('Fill in all fields as indicated', 'login')
    } else {
        let username = logUsername.val()
        let password = logPassword.val()
        socket.emit('login', { username, password })
    }
})

registerBtn.click(event => {
    event.preventDefault()
    if (regUsername.val().length <= 2 || regPasssword.val().length < 8) {
        _showLoginRegisterError('Fill in all fields as indicated', 'register')
    } else {
        registerBtn.unbind('click')
        registerBtn.attr('disabled', true)
        registerBtn[0].innerText = 'Registering...'
        registerBtn.css('cursor', 'not-allowed')
        changeToLogBtn.css('display', 'none')
        let username = regUsername.val()
        let mail = registerMail.val()
        let password = regPasssword.val()
        socket.emit('register', { username, password, mail })
    }
})

changeToLogBtn.click(event => {
    event.preventDefault()
    $('.login').css('display', 'block')
    $('.register').css('display', 'none')
})

changeToRegBtn.click(event => {
    event.preventDefault()
    $('.login').css('display', 'none')
    $('.register').css('display', 'block')
})

verifyOtp.click(event => {
    event.preventDefault();
    let usermail = usermailInVerification[0].outerText
    let otp = $('#verify-code').val()
    socket.emit('verify-otp', [usermail, otp])
})

socket.on('sign-log-error', (type, err) => {
    type === 'login' ? _showLoginRegisterError(err, 'login') : _showLoginRegisterError(err, 'register')
})

socket.on('sign-log-success', (type, user) => {
    if (type === 'login') console.log(user)
    else alert('Registered successful, kindly login')
})

socket.on('otp-sent-verify', mail => {
    usermailInVerification.text(mail)
    $('.register').css('display', 'none')
    $('.verify').css('display', 'block')
    setTimeout(() => {
        if ($('.verify').css('display') === 'block') {
            socket.emit('otp-timeout', mail)
            $('.verify').css('display', 'none')
            $('.register').css('display', 'block')
            $('#register-error').text(err)
            $('#register-error').css('display', 'block')
        }
    }, 300000)
})

socket.on('otp-err', (type, err) => {
    if (type === 'exp') {
        $('.verify').css('display', 'none')
        $('.register').css('display', 'block')
        _showLoginRegisterError(err, 'register')
    }
    if (type === 'inv') {
        $('#verify-error').text(err)
    }
})


const _showLoginRegisterError = (err, type) => {
    if (type === 'login') {
        $('#login-error').text(err)
        $('#login-error').css('display', 'block')
        setTimeout(() => {
            $('#login-error').css('display', 'none')
        }, 4000)
    } else {
        $('#register-error').text(err)
        $('#register-error').css('display', 'block')
        setTimeout(() => {
            $('#register-error').css('display', 'none')
        }, 10000)
    }
}