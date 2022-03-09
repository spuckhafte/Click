const socket = io.connect('http://localhost:6969');
const homeName = document.querySelector('#home-name');
const homeMail = document.querySelector('#home-mail');
const homeDp = document.querySelector('#home-dp');
const homeBday = document.querySelector('#home-bday');
const homeAbout = document.querySelector('#home-about');
const homeGender = document.querySelector('#home-gender');

let user = JSON.parse(sessionStorage.getItem('user'));
user = JSON.parse(user);
window.onload = () => {
    console.log(user);
    if (user !== null) {
        console.log(user['dp']);
        homeName.innerHTML += user['username'];
        homeMail.innerHTML += user['mail'];
        homeDp.src = user['avatar'];
        homeBday.innerHTML += user['dob'];
        homeAbout.innerHTML += user['about'];
        homeGender.innerHTML += user['gender'];
    } else {
        window.location.href = './login.html';
    }
}