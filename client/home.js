const socket = io.connect('http://localhost:6969');
const homeName = document.querySelector('#home-name');
const homeMail = document.querySelector('#home-mail');
const homeDp = document.querySelector('#home-dp');
const homeBdayDay = document.querySelector('#home-bday-day');
const homeBdayMonth = document.querySelector('#home-bday-month');
const homeBdayYear = document.querySelector('#home-bday-year');
const homeAbout = document.querySelector('#home-about-text');
const homeGender = document.querySelector('#home-gender');
const editProfileBtn = $('#home-editprofile');

let user = JSON.parse(sessionStorage.getItem('user'));
user = typeof user === 'object' ? user : JSON.parse(user);
window.onload = () => {
    updateUser(user);
}

editProfileBtn.click(() => { // edit profile
    // check if edit btn html contains 'edit'
    if (editProfileBtn.html().includes('edit')) { // if the button says edit
        document.querySelector('#home-editprofile span').childNodes[0].nodeValue = 'save '; // change the edit btn text
        selectText(homeAbout); // select the text in the about
        // enable the input fields
        $('#home-bday-day').attr('readonly', false);
        $('#home-bday-month').attr('readonly', false);
        $('#home-bday-year').attr('readonly', false);

        // make bday inputs have 1px solid black border
        $('#home-bday-day').css('border', '1px solid black');
        $('#home-bday-month').css('border', '1px solid black');
        $('#home-bday-year').css('border', '1px solid black');

        // set limit for the textarea
        $('#home-bday-day').attr('maxlength', 2);
        $('#home-bday-month').attr('maxlength', 2);
        $('#home-bday-year').attr('maxlength', 4);

        // make the textarea editable
        homeAbout.contentEditable = true;
        homeAbout.focus();
        return
    }

    if (editProfileBtn.html().includes('save ')) { // if the button says save
        document.querySelector('#home-editprofile span').childNodes[0].nodeValue = 'edit '; // change the edit btn text

        // disable the input fields (styling)
        $('#home-bday-day').css('border', 'none');
        $('#home-bday-month').css('border', 'none');
        $('#home-bday-year').css('border', 'none');

        // actually disable them
        $('#home-bday-day').attr('readonly', true);
        $('#home-bday-month').attr('readonly', true);
        $('#home-bday-year').attr('readonly', true);
        homeAbout.contentEditable = false; // make the textarea not editable

        let bday = homeBdayDay.value + '-' + homeBdayMonth.value + '-' + homeBdayYear.value; // combine the bday inputs
        let bdayreg = homeBdayDay.value + homeBdayMonth.value + homeBdayYear.value; // compare to the regex for common dates
        let [dateYear, dateMonth, dateDay] = [bday.split('-')[2], bday.split('-')[1], bday.split('-')[0]]; // split the bday into date components

        // check if the bday is not valid
        if (bday.length !== 10 || !bdayreg.match(/^-?\d+$/) || new Date(dateYear + '-' + dateMonth + '-' + dateDay) === 'Invalid Date' || Math.abs(new Date(dateYear, dateMonth, dateDay) - Date.now()) / 3.154e+10 < 13) {
            resetUserEditing(); // reset the editing mode
            alert('Invalid date of birth (DD-MM-YYYY)'); // alert the user
        } else { // if the bday is valid
            // notify the server with new user information
            let data = {
                username: user['username'],
                mail: user['mail'],
                avatar: user['avatar'],
                dob: bday,
                about: homeAbout.textContent.trim(),
            }
            socket.emit('edit-profile', data);
        }
    }
});

socket.on('user-updated', data => { // update the session storage with the latest information
    sessionStorage.setItem('user', data);
    let user = JSON.parse(sessionStorage.getItem('user'));
    user = JSON.parse(user);
    updateUser(user);
});

// check user clicked anywhere except about, bday, edit profile button. If it clicked anywhere else, reset the editing mode
$(document).click(function (e) {
    if (homeAbout.isContentEditable) {
        if ($(e.target).closest('#home-about-text').length === 0 && $(e.target).closest('#home-bday-day').length === 0 && $(e.target).closest('#home-bday-month').length === 0 && $(e.target).closest('#home-bday-year').length === 0 && $(e.target).closest('#home-editprofile').length === 0) {
            resetUserEditing();
            $('#home-bday-day').css('border', 'none');
            $('#home-bday-month').css('border', 'none');
            $('#home-bday-year').css('border', 'none');
        }
    }
});

function resetUserEditing() { // reset the editing mode
    let user = JSON.parse(sessionStorage.getItem('user'));
    updateUser(user);
    $('#home-bday-day').attr('readonly', true);
    $('#home-bday-month').attr('readonly', true);
    $('#home-bday-year').attr('readonly', true);
    $('#home-about-text').attr('contenteditable', false);
    document.querySelector('#home-editprofile span').childNodes[0].nodeValue = 'edit ';
}

function updateUser(_getUser) { // update the user with the latest information in the session storage
    let getUser = (typeof _getUser) === 'object' ? _getUser : JSON.parse(_getUser);
    if (getUser !== null) {
        homeName.innerHTML = user['username'];
        homeMail.innerHTML = user['mail'];
        homeDp.src = user['avatar'];
        homeBdayDay.value = user['dob'].split('-')[0];
        homeBdayMonth.value = user['dob'].split('-')[1];
        homeBdayYear.value = user['dob'].split('-')[2];
        $('#home-about-text').text(user['about']);
        homeGender.innerHTML = user['gender'];
    } else {
        window.location.href = './login.html';
    }
}

homeAbout.onkeydown = (e) => {
    if (homeAbout.contentEditable) {
        if (e.keyCode === 13) e.preventDefault(); // prevents line break when editing
        const length = homeAbout.textContent.length; // get the length of the text
        if (length > 100) if (e.keyCode !== 8 && e.keyCode !== 46) e.preventDefault(); // prevent user from entering more than 100 characters
    }
}

// select text in an element (stackoverflow)
function selectText(el, win) {
    win = win || window;
    var doc = win.document, sel, range;
    if (win.getSelection && doc.createRange) {
        sel = win.getSelection();
        range = doc.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (doc.body.createTextRange) {
        range = doc.body.createTextRange();
        range.moveToElementText(el);
        range.select();
    }
}