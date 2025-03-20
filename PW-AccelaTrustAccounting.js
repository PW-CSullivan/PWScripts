// ==UserScript==
// @name         PW-AccelaTrustAccounting
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Used for Accela CAMs Integration for Trust Accounting
// @author       Christopher Sullivan
// @match        https://butteco-test-av.accela.com/*
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/SearchElements.js
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/Waiter.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/PW-AccelaTrustAccounting.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/PW-AccelaTrustAccounting.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    var AccelWaiter = new Waiter();
    var url = window.location.href;
    AccelWaiter.addSingle('add-trust-account-tag', function() {
        if (checkExist('#Payments.tabSelected') && checkExist('#deposit')) {
            if (findByText('#CountID3', '(1)') && !checkExist('#deposit2')) {
                addMenuButton(find('#deposit'), 'Trust Account Deposit Fee', 'deposit', function() {
                    find('#Fees a').click();
                    setCookie('running-app', 'trust-account');
                    setCookie('trust-account-run', 2);
                });
            }
        }
    }, 100);
    
    AccelWaiter.addSingle('trust-account-run', function() {
        // Step 2
        clickPage('trust-account', 2, 'a#add');
        // Step 3
        if (checkRun('trust-account', 3) && checkExist('a#acsubmit')) {
            find("a#acsubmit").addEventListener('click', function() {
                setCookie('trust-account-run', 4);
            });
        }
        // Step 4
        if (checkRun('trust-account', 4) && checkExist('#row1') && checkExist('a#invoice')) {
            if (findByText('td.AlignL', 'NEW')) {
                let row = findByText('td.AlignL', 'NEW').parentElement;
                let amount = cashToNumber(find('td:nth-child(7)', row).textContent);
                setCookie('Amount', amount);
                setField(findByAttribute('input', 'type', 'checkbox', "", "", row), 'click', 'true');
                find('a#invoice').click();
            } else {
                setCookie('trust-account-run', 5);
            }
        }
        // Step 5
        clickPage('trust-account', 5, '#Payments a');
        // Step 6
        clickPage('trust-account', 6, 'a#pay');
        // Step 7
        if (checkRun('trust-account', 7) && checkExist('a#save')) {
            let el = findByAttribute('input', 'data-label', 'Amount');
            el.value = getCookie('Amount');
            eventFire(el, 'change');
            find('a#save').addEventListener('click', function() {
                //let amount = findByAttribute('input', 'data-label', 'Amount').value;
                let received = findByAttribute('table', 'data-label', 'Received');
                received = find('select', received).value;
                let payor = findByAttribute('input', 'data-label', 'Payor').value;
                let refNum = findByAttribute('input', 'data-label', 'Reference #').value;
                let checkNum = findByAttribute('input', 'data-label', 'Check Number').value;
                let checkHold = findByAttribute('input', 'data-label', "Check Holder's Name").value;
                let comment = findByAttribute('textarea', 'data-label', 'Comment').value;
                //setCookie('Amount', amount);
                setCookie('Received', received);
                setCookie('Payor', payor);
                setCookie('RefrenceNumber', refNum);
                setCookie('CheckNumber', checkNum);
                setCookie('CheckHold', checkHold);
                setCookie('Comment', comment);
                setCookie('trust-account-run', 8);
            });
        }
        // Step 8
        if (checkRun('trust-account', 8) && checkExist('input#listCount')) {
            let index = -1;
            let count = find('input#listCount').value;
            for (let i = 0; i < count; i++) {
                let sel = 'input#listOS' + i;
                if (checkExist(sel) && find(sel).value.replace('.0', '') == getCookie('Amount')) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                let el = findByAttribute('input', 'name', ('listAmount' + index));
                el.value = getCookie('Amount');
                eventFire(el, 'change');
                setField(findByAttribute('input', 'name', ('listChk' + index)), 'click', 'true');
                find('a#acsubmit').click();
                setCookie('trust-account-run', 9);
            }
        }
        // Step 9
        if (checkRun('trust-account', 9) && checkExist('a#a_Refund')) {
            let trs = findAll('tr', find('#InvoicesTableId'));
            let td = findByAttribute('td', 'headers', 'IVC IVCNumber', '', '', trs[trs.length - 1]);
            setCookie('InvoiceNumber', find('a', td).textContent);
            find('a#a_Refund').click();
            setCookie('trust-account-run', 10);
        }
        // Step 10 
        if (checkRun('trust-account', 10) && checkExist('a#update')) {
            let count = find('input#invoiceCount').value;
            let tr = find(('tr#row' + count));
            setField(findByAttribute('input', 'name', ('chkfiInvoice' + (count - 1))), 'click', 'true');
            let sel = '#payamt' + count;
            find(sel).value = getCookie('Amount');
            eventFire(find(sel), 'change');
            find('a#update').click();
            setCookie('trust-account-run', 11);
        }
        // Step 11
        if (checkRun('trust-account', 11) && checkExist('a#refund')) {
            findByAttribute('input', 'name', 'pageImage').click();
            setCookie('trust-account-run', 12);
        }
        // Step 12
        if (checkRun('trust-account', 12) && checkExist('a#acsubmit')) {
            let elParent = find('table#AccelaMainTable');
            let list = findAll('td', elParent);
            for (let i = 0; i < list.length; i++) {
                if (list[i].textContent == getCookie('Payor')) {
                    elParent = list[i].parentElement;
                    break;
                }
            }
            find('input', elParent).checked = true;
            find('a#acsubmit').click();
            setCookie('trust-account-run', 13);
        }
        // Step 13
        if (checkRun('trust-account', 13) && checkExist('a#refund')) {
            let el = findByAttribute('select', 'id', 'value(reason)');
            el.value = 'Other';
            eventFire(el, 'change');
            el = findByAttribute('select', 'id', 'value(paymentMethod)');
            el.value = 'Trust Account';
            eventFire(el, 'change');
            el = findByAttribute('input', 'id', 'value(paymentRefNbr)');
            el.value = getCookie('RefrenceNumber');
            el = findByAttribute('select', 'id', 'value(receivedType)');
            el.value = getCookie('Received');
            eventFire(el, 'change');
            el = findByAttribute('textarea', 'id', 'value(paymentComment)');
            el.value = getCookie('Comment');
            //find('a#refund').click();
            setCookie('trust-account-run', 14);
            setCookie('running-app', 'None');
        }
    });
    
    function addMenuButton(loc, title, id, clickFn) {
        let buttonPlacer = loc.parentElement;
        remove(loc);
        let buttonHref = createTagAppend(buttonPlacer, 'a', id, '', '', 'text-decoration: none; cursor: pointer;');
        createTagAppend(buttonHref, 'input', '', '', '', 'width: 0px; height: 0px; border: none;').setAttribute('tabindex', '-1');
        let buttonImg = createTagAppend(buttonHref, 'div', ('img_' + id), 'menu-left-normal-button', '', 'width: auto;');
        let buttonDiv = createTagAppend(buttonImg, 'div', (id + '2'), 'menu-right-normal-button', '',  'width: auto;');
        let ButtonInnerDiv = createTagAppend(buttonDiv, 'div', (id + '3'), 'menu-middle-normal-button', '',  'width: auto;');
        createTagAppend(ButtonInnerDiv, 'font', '', 'portlet-menu-item', title).setAttribute('aria-label', title);
        buttonImg.addEventListener('mouseover', function() {
            addClass(this, 'menu-left-hover-button');
            addClass(find('#' + id + '2'), 'menu-right-hover-button');
            addClass(find('#' + id + '3'), 'menu-middle-hover-button');
        });
        buttonImg.addEventListener('mouseout', function() {
            removeClass(this, 'menu-left-hover-button');
            removeClass(find('#' + id + '2'), 'menu-right-hover-button');
            removeClass(find('#' + id + '3'), 'menu-middle-hover-button');
        });
        buttonHref.addEventListener('click', clickFn);
        return buttonHref;
    }
    
    function clickPage(app, number, selector) {
        if (checkRun(app, number) && checkExist(selector)) {
            find(selector).click();
            setCookie((app + '-run'), ++number);
        }
    }
    
    function checkRun(app, number) {
        var rApp = getCookie('running-app') == app;
        var rNum = getCookie((app + '-run')) == number;
        if (rApp && rNum) {
            console.log('Step - ' + number);
            return true;
        }
        return false;
    }
    
    function convertToCash(number) {
        let value = "$";
        value += number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        value += ".00";
        return value;
    }
    
    function cashToNumber(text) {
        let value = text.replaceAll('.00', '');
        let number = "";
        for (let i = 0; i < value.length; i++) {
            if ("1234567890".includes(value.charAt(i))) {
                number += value.charAt(i);
            }
        }
        return number;
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
    // Your code here...
})();
