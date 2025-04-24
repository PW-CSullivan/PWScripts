// ==UserScript==
// @name         Advanced Functions
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  Used with my other scripts for advanced forms of JQuery Searches
// @author       Christopher Sullivan
// @match        *
// @require      https://code.jquery.com/jquery-3.7.1.js
// @require      https://requirejs.org/docs/release/2.3.5/minified/require.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/AdvancedFunctions.user.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/AdvancedFunctions.user.js
// @grant        none
// ==/UserScript==
function clearAllCookies() {
    console.log('CLEARING COOKIES');
    allCookiesNames = getCookieArray('all-cookie-names');
    allCookiesNames.forEach(function(c) {
        if (checkCookieArray(c)) {
            let len = getCookie(c + '.length');
            for (let i = 0; i < len; i++) {
                setCookie(c + '.' + i.toString(), '', -1);
            }
            setCookie(c + '.length', '', -1);
        }
        setCookie(c, '', -1);
    });
    allCookiesNames = [];
    setCookie('all-cookie-names', '', -1);
}

function getAllCookies() {
    let text = '';
    allCookiesNames = getCookieArray('all-cookie-names');
    allCookiesNames.forEach(function (c) {
        text += '--------------------------------------------------------------\n';
        text += c + ' = ' + getCookie(c) + '\n';
        if (checkCookieArray(c)) {
            let ar = getCookieArray(c);
            for (let i = 0; i < ar.length; i++) {
                text += c + '.' + i + ' = ' + ar[i] + '\n';
            }
            text += c + '.length = ' + getCookie(c + '.length') + '\n';
        }
    });
    return text;
}

function addCookie(cname, cvalue, exdays=1) {
    allCookiesNames = getCookieArray('all-cookie-names');
    for (let i = 0; i < allCookiesNames.length; i++) {
        if (cname == allCookiesNames[i]) {
            setCookie(cname, cvalue, exdays);
            return true;
        }
    }
    allCookiesNames.push(cname);
    setCookie(cname, cvalue, exdays);
    setCookieArray('all-cookie-names', allCookiesNames);
    return false;
}

function addToCookieArray(cname, carray, exdays=1) {
    let newArray = [];
    if (checkCookie(cname) && getCookie(cname) == 'array') {
        let newArray = getCookieArray(cname);
        if (Array.isArray(carray)) {
            carray.forEach(function (c) {
                newArray.push(c);
            });
        } else {
            newArray.push(carray);
        }
    } else {
        newArray = carray;
    }
    setCookieArray(cname, newArray, exdays);
}

/**
 * setCookie
 * a function that sets a cookie value for a default of 1 day to the current page.
 *
 * @param cname - Name of the cookie
 * @param cvalue - Value of the cookie
 * @param exdays - How long until expires
 */
function setCookie(cname, cvalue, exdays=1) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    cvalue = cvalue.toString();
    cvalue = cvalue.replaceAll('=', '}');
    cvalue = cvalue.replaceAll(';', '{');
    if (!cname.includes('all-cookie-names')) {
        console.log(cname + "=" + cvalue + ";" + expires + ";path=/");
    }
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function removeCookie(cname) {
    if (checkCookie(cname)) {
        allCookiesNames = getCookieArray('all-cookie-names');
        if (allCookiesNames.includes(cname)) {
            allCookiesNames.splice(allCookiesNames.findIndex(cname), 1);
            setCookieArray('all-cookie-names', allCookiesNames);
        }
        setCookie(cname, '', -1);
    }
}

function removeCookieArray(cname) {
    if (checkCookieArray(cname)) {
        let len = getCookie(cname + '.length');
        for (let i = 0; i < len; i++) {
            setCookie(cname + '.' + i.toString(), '', -1);
        }
        setCookie(cname + '.length', '', -1);
        removeCookie(cname);
    }
}

/**
 * setCookieArray
 * A function that sets several cookies for each value in the array.
 * Sets a cookie of cname called "array" to check if it's array.
 * Sets a cookie length of array cname + ".length"
 *
 * @param cname - base name of array
 * @param carray - the Array to put in the cookies
 * @param exdays - how long until expires
 */
function setCookieArray(cname, carray, exdays=1) {
    if (Array.isArray(carray)) {
        if (checkCookieArray(cname)) {
            let len = getCookie(cname + '.length');
            for (let i = 0; i < len; i++) {
                setCookie(cname + '.' + i.toString(), '');
            }
            setCookie(cname + '.length', '');
        }
        setCookie(cname, "array", exdays);
        setCookie((cname + ".length"), carray.length, exdays);
        for (let i = 0; i < carray.length; i++) {
            setCookie((cname + "." + i.toString()), carray[i], exdays);
        }
        if (cname != 'all-cookie-names') {
            allCookiesNames = getCookieArray('all-cookie-names');
            for (let i = 0; i < allCookiesNames.length; i++) {
                if (cname == allCookiesNames[i]) {
                    return true;
                }
            }
            setCookie('all-cookie-names', 'array');
            allCookiesNames.push(cname); 
            for (let i = 0; i < allCookiesNames.length; i++) {
                setCookie('all-cookie-names.' + i.toString(), allCookiesNames[i]);
            }
            setCookie('all-cookie-names.length', allCookiesNames.length);
        }
    }
}

/**
 * getCookie
 * a function that searches for the given cookie name and returns the value.
 * If the cookie isn't found returns ""
 *
 * @param cname - name of cookie
 */
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            let cvalue = c.substring(name.length, c.length);
            cvalue = cvalue.toString();
            cvalue = cvalue.replaceAll('}', '=');
            cvalue = cvalue.replaceAll('{', ';');
            return cvalue;
        }
    }
    return "";
}

/**
 * getCookieArray
 * A function that returns an array of values from cookies based
 * on the given cname.
 *
 * @param cname - Name of array
 */
function getCookieArray(cname) {
    let blankArray = [];
    if (checkCookieArray(cname)) {
        let size = getCookie(cname + ".length");
        for (let i = 0; i < size; i++) {
            blankArray.push(getCookie(cname + "." + i.toString()));
        }
    }
    return blankArray;
}

/**
 * checkCookie
 * A function that returns whether the cookie exists.
 *
 * @param cname - Name of cookie
 */
function checkCookie(cname) {
    if (getCookie(cname) != "") {
        return true;
    }
    return false;
}

/**
 * checkCookie
 * A function that returns whether the cookie is an array.
 *
 * @param cname - Name of cookie
 */
function checkCookieArray(cname) {
    if (getCookie(cname) == 'array') {
        return true;
    }
    return false;
}
