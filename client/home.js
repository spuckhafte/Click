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
const dpProfile = $('#home-dp');
const search = $('#search-users');

let user = JSON.parse(sessionStorage.getItem('user'));
user = typeof user === 'object' ? user : JSON.parse(user);
user = typeof user === 'object' ? user : JSON.parse(user);
window.onload = () => {
    if (user !== null) {
        console.log(user);
        updateUser(user);
        socket.emit('get-online', user, '.friends-content');
        socket.emit('get-pending', user, '.pending-req');
        socket.emit('get-sent', user, '.sent-req');
    } else {
        window.location.href = './login.html';
    }
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

$('#all-friends-tab').click(() => {
    socket.emit('get-online', user, '.friends-content');
    // change the classname of #all-friends
    $('#all-friends').attr('class', 'friends-content frnds block');
    $('#pending-requests').attr('class', 'pending-req frnds');
    $('#sent-requests').attr('class', 'sent-req frnds');
    $('#search').attr('class', 'search frnds');
})

$('#pending-tab').click(() => {
    socket.emit('get-online', user, '.friends-content');
    // change the classname of #all-friends
    $('#all-friends').attr('class', 'friends-content frnds');
    $('#pending-requests').attr('class', 'pending-req frnds block');
    $('#sent-requests').attr('class', 'sent-req frnds');
    $('#search').attr('class', 'search frnds');
})

$('#sent-tab').click(() => {
    socket.emit('get-online', user, '.friends-content');
    // change the classname of #all-friends
    $('#all-friends').attr('class', 'friends-content frnds');
    $('#pending-requests').attr('class', 'pending-req frnds');
    $('#sent-requests').attr('class', 'sent-req frnds block');
    $('#search').attr('class', 'search frnds');
})

$('#search-tab').click(() => {
    socket.emit('get-online', user, '.friends-content');
    // change the classname of #all-friends
    $('#all-friends').attr('class', 'friends-content frnds');
    $('#pending-requests').attr('class', 'pending-req frnds');
    $('#sent-requests').attr('class', 'sent-req frnds');
    $('#search').attr('class', 'search frnds block');
    $('#search-users').focus();
})

dpProfile.click(() => { // change profile picture
    socket.emit('change-dp', user['username']);
});

socket.on('user-updated', data => { // update the session storage with the latest information
    sessionStorage.setItem('user', data);
    let user = JSON.parse(sessionStorage.getItem('user'));
    user = typeof user === 'object' ? user : JSON.parse(user);
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

        homeName.setAttribute('title', user['username']);
        homeMail.setAttribute('title', user['mail']);

    } else {
        window.location.href = './login.html';
    }
}

socket.on('get-online-response', (_getUser, query, data) => { // update the online users list
    let friendsListDiv = document.querySelector(query)
    let getUser = (typeof _getUser) === 'object' ? _getUser : JSON.parse(_getUser);
    let friends = getUser['friends'];
    if (getUser !== null) {
        if (friends.length > 0) {
            // separate the friends into online and offline
            let friendNames = [];
            let friendAvatars = [];
            friends.forEach(friend => {
                friendNames.push(friend[0]);
                friendAvatars.push(friend[1]);
            });
            // get list of online users

            let onlineFriends = [];
            let offlineFriends = [];
            friendNames.forEach(friend => {
                if (data.includes(friend)) onlineFriends.push(friend);
                else offlineFriends.push(friend);
            });
            removeChildren(friendsListDiv, 'fdv');
            // update the friends list
            onlineFriends.forEach(friend => {
                let friendIndex = friendNames.indexOf(friend);
                let friendAvatar = friendAvatars[friendIndex];
                let friendName = friendNames[friendIndex];
                let friendDiv = document.createElement('div');
                friendDiv.className = 'fdv friend-list select-none';
                friendDiv.innerHTML = `<img class="fo friend-dp" src="${friendAvatar}" alt="...">
                                        <p class="fo friend-name" title=${friendName}>${friendName}</p>
                                        <i class="fo friend-status fa fa-circle green" title="online"></i>`;
                friendsListDiv.append(friendDiv);
            });
            console.log(offlineFriends)
            offlineFriends.forEach(friend => {
                let friendIndex = friendNames.indexOf(friend);
                let friendAvatar = friendAvatars[friendIndex];
                let friendName = friendNames[friendIndex];
                let friendDiv = document.createElement('div');
                friendDiv.className = 'fdv friend-list select-none';
                friendDiv.innerHTML = `<img class="fo friend-dp" src="${friendAvatar}" alt="...">
                                        <p class="fo friend-name" title=${friendName}>${friendName}</p>
                                        <i class="fo friend-status fa fa-circle red" title="offline"></i>`;
                friendsListDiv.append(friendDiv);
            });

        } else {
            removeChildren(friendsListDiv, 'fdv');
            // update the friends list with no friends
            friendDiv = document.createElement('div');
            friendDiv.className = 'fdv select-none no-content';
            friendDiv.innerHTML = 'Not yet';
            friendsListDiv.append(friendDiv);
        }
    }
})

socket.on('get-pending-response', (query, pendingReqs) => {// update the pending requests list 
    let pendingListDiv = document.querySelector(query)
    if (pendingReqs.length > 0) {
        pendingReqs.forEach(req => {
            let pendingDiv = document.createElement('div');
            pendingDiv.className = 'fdv pending-list select-none';
            pendingDiv.innerHTML = `<img class="fo friend-dp" src=${req[1]} alt="...">
                                    <p class="fo friend-name" title="${req[0]}">${req[0]}</p>
                                    <div class="acc-dec-box">
                                        <i class="fo accept fa fa-check" id="acc-req" title="accept"></i>
                                        <i class="fo decline fa fa-times" id="dec-req" title="decline"></i>
                                    </div>`;
            pendingListDiv.append(pendingDiv);
        });
    } else {
        pendingDiv = document.createElement('div');
        pendingDiv.className = 'fdv select-none no-content';
        pendingDiv.innerHTML = 'Not yet';
        pendingListDiv.append(pendingDiv);
    }
})

socket.on('get-sent-response', (query, sentReqs) => {// update the sent requests list
    let sentListDiv = document.querySelector(query)
    if (sentReqs.length > 0) {
        sentReqs.forEach(req => {
            let sentDiv = document.createElement('div');
            sentDiv.className = 'fdv sent-list select-none';
            sentDiv.innerHTML = `<img class="fo friend-dp" src=${req[1]} alt="...">
                                 <p class="fo friend-name" title=${req[0]}>${req[0]}</p>
                                 <i class="fo decline dsent fa fa-times" id="dec-sent-req" title="decline"></i>`;
            sentListDiv.append(sentDiv);
        });
    } else {
        sentDiv = document.createElement('div');
        sentDiv.className = 'fdv select-none no-content';
        sentDiv.innerHTML = 'Not yet';
        sentListDiv.append(sentDiv);
    }
})

socket.on('search-user-response', users => {// update the search results
    let searchResultsDiv = document.querySelector('#search');
    removeChildren(searchResultsDiv, 'fdv');
    if (users.length > 0) {
        users.forEach(user => {
            let userDiv = document.createElement('div');
            userDiv.className = 'fdv friend-list select-none';
            let cursor = user !== $('#home-name')[0].innerText ? '' : 'block-cursor'
            let title = user !== $('#home-name')[0].innerText ? 'add' : 'you';
            userDiv.innerHTML =  `<p class="fo friend-name name-s" title=${user}>${user}</p>
                                 <i class="fo add-friend fa fa-plus green ${cursor}" id="add-friend" title=${title}></i>`
            searchResultsDiv.append(userDiv);
        });
    } else {
        let searchResultsDiv = document.querySelector('#search');
        removeChildren(searchResultsDiv, 'fdv');
        let searchDiv = document.createElement('div');
        searchDiv.className = 'fdv select-none no-content';
        searchDiv.innerHTML = 'None';
        searchResultsDiv.append(searchDiv);
    }
})

homeAbout.onkeydown = (e) => {
    if (homeAbout.contentEditable) {
        if (e.keyCode === 13) e.preventDefault(); // prevents line break when editing
        const length = homeAbout.textContent.length; // get the length of the text
        if (length > 100) if (e.keyCode !== 8 && e.keyCode !== 46) e.preventDefault(); // prevent user from entering more than 100 characters
    }
}

search.on('keyup', () => {
    $('#search span').css('display', 'none');
    if (search.val().length >= 3) socket.emit('search-user', search.val());
    else if (search.val().length === 0) {
        removeChildren(document.querySelector('#search'), 'fdv');
        $('#search span').css('display', 'block');
    }
    else {
        let searchResultsDiv = document.querySelector('#search');
        removeChildren(searchResultsDiv, 'fdv');
        let searchDiv = document.createElement('div');
        searchDiv.className = 'fdv select-none no-content';
        searchDiv.innerHTML = 'None';
        searchResultsDiv.append(searchDiv);
    }
});

// remove children
function removeChildren(element, childClass) {
    if (element.lastChild.className !== undefined) {
        while (true) {
            if (element.lastChild.className === undefined) break;
            if (element.lastChild.className.startsWith(childClass)) element.removeChild(element.lastChild);
        }
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