const socket = io.connect('http://localhost:6969')

// html elements
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

logButton.click(event => { // login
    event.preventDefault()
    if (logUsername.val().length <= 2 || logPassword.val().length < 8) {
        _showLoginRegisterError('Fill in all fields as indicated', 'login')
    } else {
        let username = logUsername.val()
        let password = logPassword.val()
        socket.emit('login', { username, password }) // if everything is correct, send user to server
    }
})

registerBtn.click(event => { // register
    event.preventDefault()
    if (regUsername.val().length <= 2 || regPasssword.val().length < 8) {
        _showLoginRegisterError('Fill in all fields as indicated', 'register')
    } else {
        // css
        registerBtn.unbind('click')
        registerBtn.attr('disabled', true)
        registerBtn[0].innerText = 'Registering...'
        registerBtn.css('cursor', 'not-allowed')
        changeToLogBtn.css('display', 'none')

        let username = regUsername.val()
        let mail = registerMail.val()
        let password = regPasssword.val()
        socket.emit('register', { username, password, mail }) // if everything is correct, send user to server
    }
})

changeToLogBtn.click(event => { // change to login screen
    event.preventDefault()
    $('.login').css('display', 'block')
    $('.register').css('display', 'none')
})

changeToRegBtn.click(event => { // change to register screen
    event.preventDefault()
    $('.login').css('display', 'none')
    $('.register').css('display', 'block')
})

verifyOtp.click(event => { // verify otp btn
    event.preventDefault();
    let usermail = usermailInVerification[0].outerText
    let otp = $('#verify-code').val()
    socket.emit('verify-otp', [usermail, otp]) // send otp to server
})

socket.on('sign-log-error', (type, err) => { // error in login/register
    // show error based on type
    type === 'login' ? _showLoginRegisterError(err, 'login') : _showLoginRegisterError(err, 'register')
})

socket.on('sign-log-success', (type, user) => { // success in login/register
    if (type === 'login') {
        $('#login-error').css('display', 'none')
        console.log(user)
        alert('Login Successful')
        // need to work on this
    }
    else {
        $('#register-error').css('display', 'none')
        alert('Registered successful, kindly login')
        location.reload(); // reload page in order to show login screen
    }
})

socket.on('otp-sent-verify', mail => { // otp sent to user, show verify otp screen
    usermailInVerification.text(mail)
    $('.register').css('display', 'none')
    $('.verify').css('display', 'block')
    setTimeout(() => {
        // if user does not verify in 5 mins, back to register screen
        if ($('.verify').css('display') === 'block') socket.emit('otp-timeout', mail)
    }, 300000)
})

socket.on('otp-err', (type, err) => { // wrong otp (server's call)
    if (type === 'exp') {
        $('#register-error').text(err);
        $('#register-error').css('display', 'block');
        $('.verify').css('display', 'none')
        $('.register').css('display', 'block')
    }
    if (type === 'inv') $('#verify-error').text(err)
})


const _showLoginRegisterError = (err, type) => { // show errors in login/register
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