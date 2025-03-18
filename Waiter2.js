// ==UserScript==
// @name         Waiter2
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Used by my other scripts to do automation
// @author       Christopher Sullivan
// @match        *
// @require      https://raw.githubusercontent.com/PW-CSullivan/PWScripts/main/SearchElements.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/Waiter2.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/Waiter2.js
// @grant        none
// ==/UserScript==
function Waiter() {
    this.single_list = [];
    this.single_name = [];
    this.waiting_list = [];
    this.table_list = [];
    this.table_time = [];
    this.addSingle = function(name, orderCheck, check_time=1500) {
        this.single_name.push(name);
        setCookieArray("single_name", this.single_name);
        this.single_list.push(setInterval(function() {
            orderCheck();
        }, check_time));
    };
    this.clearSingle = function(name) {
        this.single_name = getCookieArray("single_name");
        var index = -1;
        for (var i = 0; i < this.single_name.length; i++) {
            if (this.single_name[i] == name) {
                index = i;
            }
        }
        if (index >= 0) {
            console.log('Single Name:', name);
            clearInterval(this.single_list[index]);
            return true;
        }
        console.log('Single Name Not Found:', name);
        return false;
    };
    this.clearAllSingles = function(title='') {
        var check = false;
        console.log('-----Clear All Singles-----');
        if (title != '') {
            console.log("Title:", title);
        }
        this.single_name = getCookieArray("single_name");
        console.log('Single Amount:', this.single_list.length);
        console.log('Single Cookie Amount:', this.single_name.length);
        for (var i = 0; i < this.single_name.length; i++) {
            if (this.clearSingle(this.single_name[i])) {
                check = true;
            }
        }
        if (!check) {
            this.single_list = [];
            this.single_name = [];
            setCookieArray("single_name", this.single_name);
        }
        console.log('---------------------------');
    };
    this.addTable = function(orderCheck, check_time=250, clearCondition=false, timer_total=60000) {
        this.waiting_list = getCookieArray("waiting_list");
        var table_number = this.waiting_list.length;
        this.table_list.push(false);
        this.table_time.push(0);
        setCookieArray("table_list", this.table_list);
        setCookieArray("table_time", this.table_time);
        this.waiting_list.push(setInterval(this.checkTable, check_time, table_number, orderCheck, clearCondition, check_time, timer_total, this));
        return this.waiting_list.length - 1; // Returns current index
    };
    this.checkTable = function(table_number, orderCheck, clearCondition, check_time, timer_total, myWaiter) {
        myWaiter.table_time = getCookieArray("table_time");
        myWaiter.table_list = getCookieArray("table_list");
        if (myWaiter.table_time[table_number] <= timer_total) {
            myWaiter.table_time[table_number] += check_time;
            if (clearCondition == false) {
                if (table_number > 0) {
                    if (myWaiter.table_list[table_number - 1]) {
                        orderCheck(table_number);
                    }
                } else {
                    orderCheck(table_number);
                }
            } else if (clearCondition.typeof == 'function') {
                if (!clearCondition()) {
                    if (table_number > 0) {
                        if (myWaiter.table_list[table_number - 1]) {
                            orderCheck(table_number);
                        }
                    } else {
                        orderCheck(table_number);
                    }
                } else {
                    myWaiter.clearAllTables();
                }
            }
        } else {
            myWaiter.clearTable(table_number);
        }
    };
    this.clearTable = function(table_number) {
        this.table_list = getCookieArray("table_list");
        this.waiting_list = getCookieArray("waiting_list");
        if (table_number < this.table_list.length &&
            table_number < this.waiting_list.length) {
            this.table_list[table_number] = true;
            this.table_time[table_number] = 0;
            setCookieArray(this.table_list);
            setCookieArray(this.table_time);
            clearInterval(this.waiting_list[table_number]);
        }
    };
    this.clearTablesBefore = function(table_number) {
        for (var i = 0; i <= table_number; i++) {
            this.clearTable(i);
        }
    };
    this.tableClearBefore = function(table_number) {
        this.table_list = getCookieArray("table_list");
        for (var i = 0; i <= table_number; i++) {
            if (!this.table_list[i]) {
                return false;
            }
        }
        return true;
    };
    this.clearAllTables = function() {
        console.log('-----Clear All Tables-----');
        console.log('Amount of Tables:', this.amountOfTables());
        this.waiting_list = getCookieArray("waiting_list");
        for (var i = 0; i < this.waiting_list.length; i++) {
            clearInterval(this.waiting_list[i]);
        }
        this.waiting_list = [];
        this.table_list = [];
        this.table_time = [];
        setCookieArray("waiting_list", this.waiting_list);
        setCookieArray("table_list", this.table_list);
        setCookieArray("table_time", this.table_name);
    };
    this.amountOfTables = function() {
        return getCookie("waiting_list.length");
    };
    this.isEmpty = function() {
        if (this.amountOfTables() > 0) {
            return false;
        }
        return true;
    };
    // Checks to see if button can be clicked then clicks it
    this.checkButtonClick = function(table_number, title, selector='button', element=false) {
        var button = findByText(selector, title, element);
        if (button) {
            if (!button.disabled) {
                button.click();
                sleep(100).then(() => {
                    this.clearTable(table_number);
                });
                return true;
            }
        }
        return false;
    };
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
    console.log(cname + "=" + cvalue + ";" + expires + ";path=/");
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
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
        setCookie(cname, "array", exdays);
        setCookie((cname + ".length"), carray.length, exdays);
        for (let i = 0; i < carray.length; i++) {
            setCookie((cname + "." + i.toString()), carray[i], exdays);
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
            return c.substring(name.length, c.length);
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
