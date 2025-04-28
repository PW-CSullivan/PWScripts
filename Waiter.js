// ==UserScript==
// @name         PW-AccelaTrustAccounting
// @namespace    http://tampermonkey.net/
// @version      0.0.4
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
    var allCookiesNames = [];
    var AccelWaiter = new Waiter();
    var url = window.location.href;
    var counter = 0;
    AccelWaiter.addSingle('add-trust-account-tag', function() {
        // Makes Sure to only Run on the inside iFrame
        if (checkExist('#iframe-page-container')) {
            AccelWaiter.clearSingle('add-trust-account-tag');
        }
        let check = (findByText('#CountID3', '(1)') || findByText('#CountID3', '(2)'));
        // Adds Trust Account Button on Payments Page
        if (checkExist('#Payments.tabSelected') && checkExist('#deposit')) {
            if (check && !checkExist('#deposit2')) {
                replaceMenuButton(find('#deposit'), 'Trust Account Deposit Fee', 'deposit', function() {
                    clearAllCookies();
                    addCookie('gray-overlay-show', true);
                    addCookie('grab-ticket-number', true);
                    let url = document.location.href;
                    let index = url.lastIndexOf('.') + 1;
                    addCookie('url-ticket-number', grabURLTicket());
                    //addCookie('order-number', find('.r-id').textContent);
                    //find('#Payments a').click();
                    find('#TrustAccounts a').click();
                    addCookie('running-app', 'trust-account');
                    addCookie('trust-account-run', 2);
                });
            }
        }
        // Adds Trust Account Button on Trust Accounts Page
        if (checkExist('#TrustAccounts.tabSelected') && checkExist('#a_search') &&
           findByText('td.portlet-section-body:nth-child(5)', 'Y', find('#AccelaMainTable'))) {
            if (check && !checkExist('#deposit2')) {
                addMenuButton('Trust Account Deposit Fee', 'deposit', function() {
                    clearAllCookies();
                    addCookie('gray-overlay-show', true);
                    addCookie('grab-ticket-number', true);
                    let url = document.location.href;
                    let index = url.lastIndexOf('.') + 1;
                    addCookie('url-ticket-number', grabURLTicket());
                    //addCookie('order-number', find('.r-id').textContent);
                    //find('#Payments a').click();
                    addCookie('running-app', 'trust-account');
                    addCookie('trust-account-run', 2);
                });
            }
        }
    }, 100);
    
    // Grabs Ticket number
    AccelWaiter.addSingle('grab-ticket-number', function() {
        if (getCookie('grab-ticket-number') == 'true') {
            addCookie('ticket-number', find('h1.r-id', getActiveDiv()).textContent.trim());
            addCookie('grab-ticket-number', false);
            let frames = findAll('#iframe-page-container');
            for (let i = 0; i < frames.length; i++) {
                frames[0].setAttribute('id', ('iframe-page-container' + i));
            }
            find('iframe', getActiveDiv()).setAttribute('id', 'iframe-page-container');
        }
    });
    
    // In Fee Schedule Only keep Public Work Related Items
    AccelWaiter.addSingle('fee-schedule-clean-up', function() {
        if (checkExist('select#FeeSched') && findByAttribute('option', 'value', 'EH_ADMIN')) {
            let options = findAll('option', find('select#FeeSched'));
            options.forEach(function (el) {
                if (!el.value.includes('PW') && el.value != 'NONE') {
                    remove(el);
                }
            });
        }
    });

    // Reset all Cookies if at Home Page
    AccelWaiter.addSingle('cookie-reset-main-page', function() {
        if (checkURL("https://butteco-test-av.accela.com/portlets/web/en-us/#/core/tasks") &&
            getCookie('all-cookie-names') != '') {
                clearAllCookies();
        }
    });
    
    // When Cloning Records Auto Select Public Works
    AccelWaiter.addSingle('clone-record-selector', function() {
        if (checkURL("https://butteco-test-av.accela.com/portlets/picker/capTypePickerSelector.do") &&
           findByAttribute('li', 'data-value', 'Amendments')) {
            findByText('a', 'PublicWorks').click();
            sleep(250).then(() => {
                addClass(findByAttribute('li', 'data-value', 'Public Works'), 'expand');
            });
        }
    }, 100);

    // Gray Overlay of Screen
    AccelWaiter.addSingle('gray-overlay', function() {
        if (checkExist('#iframe-page-container')) {
            if (getCookie('gray-overlay-show') == 'true') {
                addGrayOverlay();
            } else {
                hideGrayOverlay();
            }
        }
    }, 100);
    
    AccelWaiter.addSingle('error-message', function() {
        if (checkExist('#iframe-page-container'), getActiveDiv()) {
            if (getCookie('error-message-show') == 'true' && !checkExist('#error-info')) {
                displayErrorList(getCookie('error-message-text'));
            }
        }
    });

    // Trust Account Deposit Process
    AccelWaiter.addSingle('trust-account-run', function() {
        var n = 1;
        var stepRun = getCookie('step-run');
        var selectors = getCookieArray('selectors');
        if (stepRun == '' || stepRun == 'NaN') {
            stepRun = 0;
        }
        if (getCookie('running-app') == 'trust-account' &&
            stepRun >= 1 &&
            checkExist('#iframe-page-container') &&
            find('#iframe-page-container').contentDocument.readyState == 'complete') {
            // Do stuff
            var exists = false;
            if (find('h1.r-id', getActiveDiv()).textContent.trim() == getCookie('ticket-number')) {
                console.log('We are in the Frame Checking');
                selectors.forEach(function(sel) {
                    if (findInFrame(find('#iframe-page-container'), sel) == null && !exists) {
                        console.log(checkExist('#iframe-page-container'));
                        console.log(find('#iframe-page-container'));
                        console.log(findInFrame(find('#iframe-page-container'), sel));
                        console.log("It doesn't exist in the Frame");
                        console.log(sel);
                        exists = false;
                    } else {
                        exists = true;
                    }
                });
            } else {
                alert("Wrong Page");
            }
            if (!exists) {
                console.log('Moved From Page');
                //addCookie('error-message-show', true);
                alert('Cancelling Automation Process');
                find('#iframe-page-container').contentWindow.location.reload();
                clearAllCookies();
            }
        }
        if (checkRun('trust-account', ++n) && checkExist('#AccelaMainTable')) {
            if (findByText('td.portlet-section-body:nth-child(5)', 'Y', find('#AccelaMainTable'))) {
                clickPage('trust-account', n, '#Payments a');
            } else {
                alert("Please Select a Primary Trust Account and try again.");
                clearAllCookies();
                location.reload();
            }
        }
        //var orderNum = getCookie('order-number');
        // Step 3 - Pay Info Page
        clickPage('trust-account', ++n, 'a#pay');
        // Step 4 - Payor Page
        clickPage('trust-account', ++n, findByAttribute('input', 'alt', 'Select Payor'));
        // Step 5 - Go back to Pay Info Page
        if (checkRun('trust-account', ++n) && checkExist('#acsubmit')) {
            if (!checkExist('a.my-click-added4')) {
                addCookie('gray-overlay-show', false);
                addCookie('step-run', ++stepRun);
                setCookieArray('selectors', ['a#acsubmit']);
                find('#acsubmit').addEventListener('click', function() {
                    addCookie('step-run', 0);
                    setCookieArray('selectors', [''], -1);
                    addCookie('trust-account-run', 6);
                });
                addClass(find('a#acsubmit'), 'my-click-added4');
            }
            counter = 0;
        }
        // Step 6 - Grab all Payment Info then go to Fee Page
        if (checkRun('trust-account', ++n) && checkExist('a#save')) {
            if (!checkExist('a.my-click-added5')) {
                addCookie('gray-overlay-show', false);
                addCookie('step-run', ++stepRun);
                remove(findByAttribute('input', 'alt', 'Select Payor'));
                remove('option', 'Journal Entry');
                remove('option', 'Fee Waiver');
                remove('option', 'Trust Account');
                removeButton('Menu');
                removeButton('Pay More');
                removeButton('Reset');
                removeButton('Help');
                setCookieArray('selectors', ['a#save']);
                replaceMenuButton(find('#save'), 'Trust Account Payment', 'save', function() {
                    let method = findByAttribute('select', 'id', 'value(method)');
                    let received = findByAttribute('select', 'id', 'value(receivedType)');
                    //let received = findByAttribute('table', 'data-label', 'Received');
                    //received = find('select', received).value;
                    let authCode = findByAttribute('input', 'data-label', 'CC Auth. Code');
                    let payor = findByAttribute('input', 'data-label', 'Payor');
                    let refNum = findByAttribute('input', 'data-label', 'Reference #');
                    let checkNum = findByAttribute('input', 'data-label', 'Check Number');
                    let checkHold = findByAttribute('input', 'data-label', "Check Holder's Name");
                    let comment = findByAttribute('textarea', 'data-label', 'Comment');
                    let total = findByAttribute('input', 'data-label', 'Amount');
                    addCookie('TotalAmount', total.value);
                    addCookie('Method', method.value);
                    addCookie('CCAuthCode', authCode.value);
                    addCookie('Received', received.value);
                    addCookie('Payor', payor.value);
                    addCookie('ReferenceNumber', refNum.value);
                    addCookie('CheckNumber', checkNum.value);
                    addCookie('CheckHold', checkHold.value);
                    addCookie('Comment', comment.value);
                    if (checkRequired('Method', method) && checkRequired('Received', received) && 
                        checkRequired('CC Auth. Code', authCode) && checkRequired('Payor', payor) &&
                       checkRequired('Reference Number', refNum) && checkRequired('Check Number', checkNum) &&
                       checkRequired("Check Holder's Name", checkHold) && checkRequired('Comment', comment) &&
                       checkRequired('Amount', total)) {
                        addCookie('trust-account-run', 7);
                        addCookie('step-run', 0);
                        addCookie('gray-overlay-show', true);
                        setCookieArray('selectors', [''], -1);
                        find('#Fees a').click();
                    }
                });
                addClass(find('a#save'), 'my-click-added5');
            }
            counter = 0;
        }
        // Step 7 - If Fee skip a head otherwise go to Add Fee Page
        if (checkRun('trust-account', ++n) && checkExist('a#add')) {
            let index = getColumn('Balance');
            if (index != -1) {
                if (findByText('td.AlignL', 'NEW') != null) {
                    // Skip the Creation of Fee Item
                    addCookie('gray-overlay-show', true);
                    addCookie('trust-account-run', 9);
                } else {
                    find('a#add').click();
                    addCookie('trust-account-run', 8);
                }
            }
        }
        //clickPage('trust-account', 6, 'a#add');
        // Step 8 - Add Fee Page waiting for info to be filled out
        if (checkRun('trust-account', ++n) && checkExist('a#acsubmit')) {
            if (!checkExist('a.my-click-added')) {
                addCookie('gray-overlay-show', false);
                addCookie('step-run', ++stepRun);
                setCookieArray('selectors', ['a#acsubmit']);
                removeButton('Menu');
                removeButton('Help');
                //addCookie('frame-url', window.location.href);
                find("a#acsubmit").addEventListener('click', function() {
                    //addGrayOverlay();
                    addCookie('gray-overlay-show', true);
                    addCookie('step-run', 0);
                    setCookieArray('selectors', [''], -1);
                    addCookie('user-error-message', "Please Delete out Fee with no Invoice Number and try again.");
                    addCookie('trust-account-run', 9);
                });
                addClass(find('a#acsubmit'), 'my-click-added');
            }
            counter = 0;
        }
        // Step 9
        orderListUp('trust-account', ++n, 'Invoice #');
        // Step 10 - Click Check box of Fee then Invoice it
        if (checkRun('trust-account', ++n) && checkExist('#row1') && checkExist('a#invoice')) {
            if (findByText('td.AlignL', 'NEW')) {
                let index = getColumn('Balance');
                let row = findByText('td.AlignL', 'NEW').parentElement;
                let amount = cashToNumber(find('td:nth-child(' + index + ')', row).textContent);
                addCookie('Amount', amount);
                if (amount != getCookie('TotalAmount')) {
                    setError('Expected Deposit Amount was: ' + getCookie('TotalAmount') + ' but what the fee balance is: ' + amount + ' please make these numbers match and try again.');
                } else {
                    setField(findByAttribute('input', 'type', 'checkbox', "", "", row), 'click', 'true');
                    find('a#invoice').click();
                    removeCookie('user-error-message');
                    sleep(250);
                }
            } else {
                counter = 0;
                addCookie('trust-account-run', 11);
            }
        }
        // Step 11
        orderList('trust-account', ++n, 'Invoice #');
        // Step 12 - Grab Invoice Number
        setRun('trust-account', ++n, 'tr#row1', function() {
            let index = getColumn('Invoice');
            let row = find('tr#row1');
            let invoiceNum = find('td:nth-child(' + index + ')', row).textContent.trim();
            addCookie('FeeInvoiceNumber', invoiceNum);
        });
        // Step 13 - Go to Payments Page
        clickPage('trust-account', ++n, '#Payments a');
        // Step 14 - Pay payments page
        clickPage('trust-account', ++n, 'a#pay');
        // Step 15 - Go to Payor Page
        clickPage('trust-account', ++n, findByAttribute('input', 'alt', 'Select Payor'));
        // Step 16 - Select Payor
        setRun('trust-account', ++n, 'a#acsubmit', function() {
            let payor = getCookie('Payor');
            let index = 0;
            for (let i = 0; i < 10; i++) {
                let idName = '#paidToName' + i;
                if (checkExist(idName) && find(idName).value == payor) {
                    find('#ac360_list_id', find(idName).parentElement).click();
                    break;
                }
            }
        });
        // Step 17 - Fill Pay Page
        setRun('trust-account', ++n, 'a#save', function() {
            let method = getCookie('Method');
            changeValue('input', 'data-label', 'Amount', 'Amount');
            changeValue('select', 'id', 'value(method)', method);
            changeValue('select', 'id', 'value(receivedType)', 'Received');
            let comment = getCookie('Comment') + '\nFee Invoice #: ' + getCookie('FeeInvoiceNumber');
            changeValue('textarea', 'data-label', 'Comment', comment);
            if (method == 'Check' || method == 'Credit Card') {
                changeValue('input', 'data-label', 'Reference #', 'ReferenceNumber');
                if (method == 'Credit Card') {
                    changeValue('input', 'data-label', 'CC Auth. Code', 'CCAuthCode');
                } else if (method == 'Check') {
                    changeValue('input', 'data-label', 'Check Number', 'CheckNumber');
                    changeValue('input', 'data-label', "Check Holder's Name", 'CheckHold');
                }
            }
        });
        // Step 18 - Check if Receipt was generated or not. 
        if (checkRun('trust-account', ++n) && (checkExist('input#listCount') || checkExist('a#generateReceipt'))) {
            if (checkExist('a#generateReceipt')) {
                addCookie('trust-account-run', 19);
            } else {
                let index = -1;
                let count = find('input#listCount').value;
                for (let i = 0; i < count; i++) {
                    let sel = 'input#listOS' + i;
                    if (checkExist(sel) && find(sel).value.replace('.0', '.00') == getCookie('Amount')) {
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
                    addCookie('trust-account-run', 19);
                    counter = 0;
                }
            }
        }
        // Step 19 - Get Pay Invoice Number and Receipt Number
        if (checkRun('trust-account', ++n) && checkExist('a#a_Refund')) {
            let trs = findAll('tr', find('#InvoicesTableId'));
            let td = findByAttribute('td', 'headers', 'IVC IVCNumber', '', '', trs[trs.length - 1]);
            addCookie('PayInvoiceNumber', find('a', td).textContent.trim());
            let table = find('#transactionTableId');
            addCookie('ReceiptNumber', find('a', table).textContent.trim());
            find('#Fees a').click();
            addCookie('trust-account-run', 20);
        }
        // Step 20
        orderList('trust-account', ++n, 'Invoice #');
        // Step 21 - Void Fee Start
        setRun('trust-account', ++n, findByText('a#linkrow1', getCookie('PayInvoiceNumber')), function () {
            if (findByText('a#linkrow1', getCookie('PayInvoiceNumber'))) {
                let row = find('tr#row1');
                setField(find('#ac360_list_id', row), 'click', 'true');
                let bVoid = find('a#void');
                bVoid.style.zIndex = '9999';
                find('font', bVoid).innerText = 'CLICK ME';
                find('font', bVoid).style = 'font-size: 48px;';
                bVoid.click();
                sleep(1000).then(() => {
                    find('a#void').click();
                });
            }
        });
        // Step 22
        if (checkRun('trust-account', ++n)) {
            //alert('Clicking Void');
            //console.log('Clicking Void');
            setCookieArray('selectors', ['a#void']);
            if (checkExist('a#invoice')) {
                removeButton('Menu');
                removeButton('Delete');
                removeButton('Invoice');
                removeButton('Invoice & Pay');
                removeButton('ReCalc');
                removeButton('Help');
                find('#utility-menu').style = 'display: none;';
                find('#feeItemTable').style = 'display: none;';
                find('#AccelaMainTable').style = 'display: none;';
                find('#pagingInfo').style = 'display: none;';
                find('a#add').style = 'display: none;';
                addCookie('gray-overlay-show', false);
                alert("Please Click the button 'CLICK ME'");
            }
            counter = 0;
            if (checkExist('#a_submitBtn')) {
                addCookie('trust-account-run', 23);
            }
        }        
        // Step 23 - Void Fee Popup
        setRun('trust-account', ++n, '#a_submitBtn', function() {
            changeValue('select', 'id', 'value(reason)', 'Trust Deposit');
            let comment = 'Trust Account Deposit';
            comment += '\nPayment Invoice #: ' + getCookie('PayInvoiceNumber');
            comment += '\nPayment Receipt #: ' + getCookie('ReceiptNumber');
            changeValue('textarea', 'id', 'value(comment)', comment);
        });
        // Step 24
        orderList('trust-account', ++n, 'Invoice #');
        // Step 25 - Invoice the Void
        setRun('trust-account', ++n, 'a#invoice', function() {
            let row = find('tr#row1');
            setField(find('#ac360_list_id', row), 'click', 'true');
        });
        // Step 26 - go to Payment page
        clickPage('trust-account', ++n, '#Payments a');
        // Step 27 - Refund Payment to Trust Accound
        clickPage('trust-account', ++n, 'a#a_Refund');
        // Step 28 - Go to Refund Page
        clickPage('trust-account', ++n, 'a#update');
        // Step 29 - Fill Out Refund Page
        setRun('trust-account', ++n, 'a#refund', function() {
            changeValue('select', 'id', 'value(reason)', 'Trust Account Deposit');
            changeValue('input', 'id', 'value(paymentAmount)', 'Amount');
            changeValue('select', 'id', 'value(paymentMethod)', 'Trust Account');
            sleep(500);
        });
        // Step 30 - Close Out
        if (checkRun('trust-account', ++n) && checkExist('a#pay')) {
            find('#TrustAccounts a').click();
            clearAllCookies();
        }
        if (counter == 20 && getCookie('running-app') == 'trust-account') {
            console.log('DISPLAY ERROR');
            addCookie('error-message-show', true);
            addCookie('error-message-text', "Counter = " + counter.toString());
            //displayErrorList("Counter = " + counter.toString());
            //clearAllCookies();
        }
        if (!checkExist('#iframe-page-container') && !checkExist('#walkme-native-functions') && 
            getCookie('running-app') == 'trust-account' && checkURL(getCookie('url-ticket-number')) && stepRun == 0) {
            counter++;
        }
    }, 500);
    
    function grabURLTicket() {
        let url = document.location.href;
        if (checkExist('#CapTabSummary')) {
            url = find('#CapTabSummary a').href;
        }
        let start = url.lastIndexOf('.') + 1;
        if (url.includes('&') && url.lastIndexOf('&') > start) {
            let end = url.lastIndexOf('&');
            return url.substring(start, end);
        }
        return url.substring(start);
    }
    
    function getActiveDiv() {
        let elem = false;
        if (checkExist('#content')) {
            let elParent = find('#content');
            let els = findWOClass(findAll('div.ng-star-inserted', elParent), 'hidden');
            if (els.length > 1) {
                els.forEach(function (el) {
                    //console.log(el.parentElement.id);
                    if (el.parentElement.id.toString() == 'content') {
                        elem = el;
                    }
                });
            }
        }
        if (elem == null) {
            return false;
        }
        return elem;
    }
    
    function findWOClass(selector, woClass) {
        let allEls = [];
        let allElsWOClass = [];
        if (typeof selector === "string") {
            allEls = findAll(selector);
        } else {
            allEls = selector;
        }
        allEls.forEach(function (el) {
            if (!el.classList.contains(woClass)) {
                allElsWOClass.push(el);
            }
        });
        return allElsWOClass;
    }
    
    function checkRequired(title, selector) {
        let el;
        if (typeof(selector) == "string") {
            el = find(selector);
        } else {
            el = selector;
        }
        let table = getTable(el);
        if (findByText('font.Redstar', '*', table)) {
            if (el.value != "" && el.value != "0.00" && el.value != "--Select--") {
                return true;
            }
        } else {
            return true;
        }
        alert(title + ' is required. Please Fill in and try again.');
        return false;
    }
    
    function setError(message) {
        alert(message);
        clearAllCookies();
        sleep(250);
    }
    
    function displayErrorList(message) {
        // My Step 10 to 12 is Step 8
        // my stop 13 is 9
        addCookie('gray-overlay-show', true);
        if (checkExist('#gray-overlay')) {
            if (!checkExist('#error-info')) {
                let overlay = createTagAppend(find('#gray-overlay'), 'div', 'error-info');
                overlay.style.position = 'fixed';
                overlay.style.top = '25%';
                overlay.style.padding = '2%';
                overlay.style.left = '34%';
                overlay.style.width = '33%';
                overlay.style.height = '50%';
                overlay.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // Gray with 50% opacity
                overlay.style.zIndex = '9999'; // Ensure it's on top
                createTagAppend(overlay, 'h1', '', '', 'Error List', 'text-align: center;');
                createTagAppend(overlay, 'hr');
                let textarea = createTagAppend(overlay, 'textarea', 'error-data');
                textarea.style.width = '100%';
                textarea.style.height = '78%';
                textarea.style.margin = '0px';
                textarea.style.resize = 'none';
                textarea.readOnly = true;
                createTagAppend(overlay, 'hr');
                let close = createTagAppend(overlay, 'button', 'close-button', '', 'Close', 'width: 100%; font-size: 18px;');
                close.addEventListener('click', function() {
                    clearAllCookies();
                    remove('#error-info');
                });
            } else {
                let overlay = find('#gray-overlay');
                overlay.style.width = '33%';
                overlay.style.height = '50%';
            }
            let text = '';
            if (message) {
                text = message + '\n';
            }
            addCookie('URL', document.location.href);
            text += getAllCookies();
            let textarea = find('#error-data');
            textarea.value = text;
            textarea.addEventListener('click', function() {
                navigator.clipboard.writeText(find('#error-data').value).then(() => {
                    alert('Error Message was Copied to Clipboard');
                });
            });
        }
    }
    
    function getTable(selector) {
        let el;
        if (typeof(selector) == "string") {
            el = find(selector);
        } else {
            el = selector;
        }
        while (el.tagName != 'TABLE') {
            el = el.parentElement;
        }
        return el.parentElement;
    }
    
    function removeButton(title) {
        let el;
        if (typeof(title) == "string") {
            el = findByText('a', title);
        } else {
            el = title;
        }
        remove(getTable(el));
    }
    
    function addMenuButton(title, id, clickFn) {
        let menuBar = find('#menu_Bar');
        let tr = find('tr', menuBar);
        let td = createTagAppend(tr, 'td', '', '', '', 'padding-left:5px;padding-right:5px;');
        let table = createTagAppend(td, 'table');
        table.setAttribute('border', '0');
        table.setAttribute('cellspacing', '0');
        table.setAttribute('cellpadding', '0');
        let tbody = createTagAppend(table, 'tbody');
        tr = createTagAppend(tbody, 'tr');
        td = createTagAppend(tr, 'td');
        let aHREF = createTagAppend(td, 'a');
        replaceMenuButton(aHREF, title, id, clickFn);
    }

    function replaceMenuButton(loc, title, id, clickFn) {
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
    
    function setRun(app, number, selector, rFunc) {
        let exist = false;
        if (typeof(selector) != "string") {
            if (selector != null || selector != false) {
                exist = true;
            }
        } else if (typeof(selector) == "boolean" && !selector) {
            exist = selector;
        } else {
            exist = checkExist(selector);
            selector = find(selector);
        }
        if (checkRun(app, number) && exist) {
            rFunc();
            selector.click();
            addCookie((app + '-run'), ++number);
            return true;
        }
        return false;
    }

    function clickPage(app, number, selector) {
        let exist = false;
        if (typeof(selector) != "string") {
            if (selector != null || selector != false) {
                exist = true;
            }
        } else {
            exist = checkExist(selector);
            selector = find(selector);
        }
        if (checkRun(app, number) && exist) {
            //addGrayOverlay();
            //addCookie('step-run', true);
            addCookie('gray-overlay-show', true);
            selector.click();
            addCookie((app + '-run'), ++number);
            return true;
        }
        return false;
    }
    
    function orderList(app, number, title) {
        if (checkRun(app, number) && checkExist('#AccelaMainTable')) {
            let table = find('#AccelaMainTable');
            let el = findByText('a', title, table);
            if (el) {
                if (checkExist('a.order_down')) {
                    if (!find('a.order_down', table).textContent.includes(title)) {
                        return clickPage(app, number, el);
                    } else {
                        addCookie('gray-overlay-show', true);
                        addCookie((app + '-run'), ++number);
                        return true;
                    }
                } else {
                    return clickPage(app, number, el);
                }
            }
        }
        return false;
    }
    
    function orderListUp(app, number, title) {
        if (checkRun(app, number) && checkExist('#AccelaMainTable')) {
            let table = find('#AccelaMainTable');
            let el = findByText('a', title, table);
            if (el) {
                if (checkExist('a.order_up')) {
                    if (find('a.order_up', table).textContent.includes(title)) {
                        addCookie('gray-overlay-show', true);
                        addCookie((app + '-run'), ++number);
                        return true;
                    }
                }
                el.click();
            }
            return false;
        }
    }

    function checkRun(app, number) {
        var rApp = getCookie('running-app') == app;
        var rNum = getCookie((app + '-run')) == number;
        var status = document.readyState === 'complete';
        var inFrame = !checkExist('#iframe-page-container');
        let ticketNum = getCookie('url-ticket-number');
        let urlCheck = grabURLTicket() == getCookie('url-ticket-number');
        if (rApp && rNum && status && inFrame && urlCheck) {
            console.log('Step - ' + number);
            return true;
        }
        return false;
    }
    
    function checkRunOtherFrame(app, number) {
        var rApp = getCookie('running-app') == app;
        var rNum = getCookie((app + '-run')) == number;
        var status = document.readyState === 'complete';
        var inFrame = !checkExist('#iframe-page-container');
        if (rApp && rNum && status && inFrame) {
            console.log('Step - ' + number);
            return true;
        }
        return false;
    }
    
    function changeValue(selector, attribute, value, cookie) {
        let el = findByAttribute(selector, attribute, value);
        if (checkCookie(cookie)) {
            el.value = getCookie(cookie);
        } else {
            el.value = cookie;
        }
        eventFire(el, 'change');
    }
    
    function getColumn(title) {
        let table = find('#AccelaMainTable');
        let index = -1;
        for (let i = 1; i < 15 && checkExist('th:nth-child(' + i + ')', table); i++) {
            if (find('th:nth-child(' + i + ')', table).textContent.includes(title)) {
                index = i;
                break;
            }
        }
        if (index == -1) {
            setError(title + ' Column was not found. Please Add the column and try again.');
            //addCookie('Error', true);
        }
        return index;
    }

    function convertToCash(number) {
        let value = "$";
        value += number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        value += ".00";
        return value;
    }

    function cashToNumber(text) {
        let number = "";
        for (let i = 0; i < text.length; i++) {
            if ("1234567890.".includes(text.charAt(i))) {
                number += text.charAt(i);
            }
        }
        return number;
    }

    function hideGrayOverlay() {
        if (checkExist('#gray-overlay')) {
            let overlay = find('#gray-overlay');
            overlay.style.width = '0%';
            overlay.style.height = '0%';
        }
    }

    function addGrayOverlay() {
        if (!checkExist('#gray-overlay')) {
            let overlay = createTagAppend(document.body, 'div', 'gray-overlay');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Gray with 50% opacity
            overlay.style.zIndex = '9998'; // Ensure it's on top
        } else {
            let overlay = find('#gray-overlay');
            overlay.style.width = '100%';
            overlay.style.height = '100%';
        }
    }

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
    // Your code here...
})();
