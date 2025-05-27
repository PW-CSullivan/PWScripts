// ==UserScript==
// @name         PW-AccelaTrustAccounting-TestSlim
// @namespace    http://tampermonkey.net/
// @version      0.0.6
// @description  Used for Accela CAMs Integration for Trust Accounting
// @author       Christopher Sullivan
// @match        https://butteco-test-av.accela.com/*
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/SearchElements.js
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/Waiter.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/PW-AccelaTrustAccounting-TestSlim.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/PW-AccelaTrustAccounting-TestSlim.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var allCookiesNames = [];
    var AccelWaiter = new Waiter();
    var url = window.location.href;
    var counter = 0;
    AccelWaiter.addSingle('inner-frame', function() {
        // Makes Sure to only Run on the inside iFrame
        if (checkExist('#iframe-page-container')) {
            AccelWaiter.clearSingle('inner-frame');
        }
        let check = (findByText('#CountID3', '(1)') || findByText('#CountID3', '(2)'));
        // Adds Trust Account Button on Payments Page
        if (checkExist('#Payments.tabSelected') && checkExist('#deposit')) {
            if (check && !checkExist('#deposit2')) {
                replaceMenuButton(find('#deposit'), 'Trust Account Deposit Fee', 'deposit', function() {
                    clearAllCookies();
                    addCookie('gray-overlay-show', true);
                    addCookie('grab-ticket-number', true);
                    addCookie('url-ticket-number', grabURLTicket());
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
                    updateStepScreen(1);
                    addCookie('url-ticket-number', grabURLTicket());
                    addCookie('running-app', 'trust-account');
                    addCookie('trust-account-run', 2);
                });
            }
        }
        // Clean Up Fee Options
        if (checkExist('select#FeeSched') && findByAttribute('option', 'value', 'EH_ADMIN')) {
            let options = findAll('option', find('select#FeeSched'));
            options.forEach(function (el) {
                if (!el.value.includes('PW') && el.value != 'NONE') {
                    remove(el);
                }
            });
        }
        // Main Script for Automation
        var n = 1;
        // Step 2 - Test for Default Trust Account
        if (checkRun('trust-account', ++n) && checkExist('#AccelaMainTable')) {
            if (findByText('td.portlet-section-body:nth-child(5)', 'Y', find('#AccelaMainTable'))) {
                updateStepScreen(1);
                addCookie('grab-ticket-number', true);
                addCookie('gray-overlay-show', true);
                addCookie('trust-account-run', 3);
            } else {
                alert("Please Select a Primary Trust Account and try again.");
                clearAllCookies();
                location.reload();
            }
        }
        // Step 3 - Go to Fee Page
        clickPage('trust-account', ++n, '#Fees a');
        // Step 4 - Check that there is no New Fee item already
        if (checkRun('trust-account', ++n) && checkExist('a#add')) {
            let index = getColumn('Balance');
            if (index != -1) {
                if (findByText('td.AlignL', 'NEW') != null) {
                    alert("There is already a New Fee item. Please delete the fee item and try again.");
                    clearAllCookies();
                    location.reload();
                } else {
                    updateStepScreen(2);
                    addCookie('trust-account-run', 5);
                }
            } else {
                alert("There is no Balance Column. Please configure your layout to have the Balance Column and try again.");
                clearAllCookies();
                location.reload();
            }
        }
        // Step 5 - Go to Add Fee to Grab Data
        clickPage('trust-account', ++n, 'a#add');
        // Step 6 - Grab Data from Fee Page
        setRun('trust-account', ++n, '#AccelaMainTable', function() {
            let table = find('#AccelaMainTable');
            let rows = findAll('tr.portlet-section-body', table);
            let feeName = [];
            let feeCode = [];
            let feeUnit = [];
            let feeMultiplier = [];
            for (let i = 0; i < rows.length; i++) {
                let feeItems = findAll('td', rows[i]);
                feeName.push(feeItems[0].textContent.trim());
                feeCode.push(feeItems[1].textContent.trim());
                feeUnit.push(feeItems[3].textContent.trim());
                feeMultiplier.push(findByAttribute('input', 'name', 'value(FormulaName,' + i + ')').value);
            }
            setCookieArray('fee-names', feeName);
            setCookieArray('fee-codes', feeCode);
            setCookieArray('fee-units', feeUnit);
            setCookieArray('fee-multiplier', feeMultiplier);
        });
        // Step 7 - Go To Payment Page
        clickPage('trust-account', ++n, '#Payments a');
        // Step 8 - Go to Add Payment Page
        clickPage('trust-account', ++n, 'a#pay');
        // Step 9 - Grab Pay Data
        if (checkRun('trust-account', ++n) && findByAttribute('input', 'alt', 'Select Payor')) {
            let table = find('#content_main_table');
            let methodSelect = findByAttribute('select', 'name', 'value(method)');
            let methodShow = [];
            let methodRequired = [];
            let grabbedAll = false;
            if (methodSelect.value == 'Cash') {
                changeValue('select', 'id', 'value(method)', 'Check');
            } else if (methodSelect.value != 'Cash') {
                let reference = findByAttribute('table', 'id', 'elementTableContainer(reference)');
                methodShow.push(reference.style.visibility == 'visible' ? true : false);
                methodRequired.push(checkExist('td#checkNbrTd', reference) ? true : false);
                
                let checkNumber = findByAttribute('table', 'id', 'elementTableContainer(checkNbr)');
                methodShow.push(checkNumber.style.visibility == 'visible' ? true : false);
                methodRequired.push(checkExist('td#checkNbrTd', checkNumber) ? true : false);
                
                let checkHolder = findByAttribute('table', 'id', 'elementTableContainer(name)');
                methodShow.push(checkHolder.style.visibility == 'visible' ? true : false);
                methodRequired.push(checkExist('td#checkNbrTd', checkHolder) ? true : false);
                
                let ccAuthCode = findByAttribute('table', 'id', 'elementTableContainer(ccAuthCode)');
                methodShow.push(ccAuthCode.style.visibility == 'visible' ? true : false);
                methodRequired.push(checkExist('td#checkNbrTd', ccAuthCode) ? true : false);
                
                if (methodSelect.value == 'Check') {
                    changeValue('select', 'id', 'value(method)', 'Credit Card');
                } else {
                    grabbedAll = true;
                }
            }
            if (grabbedAll) {
                setCookieArray('method-show', methodShow);
                setCookieArray('method-required', methodRequired);
                addCookie('trust-account-run', 10);
                findByAttribute('input', 'alt', 'Select Payor').click();
            }
        }
        // Step 10 - Grab Payor data
        setRun('trust-account', ++n, 'a#cancel', function() {
            let table = find('#AccelaMainTable');
            let rowCount = findAll('tr', table);
            let payName = [];
            let payType = [];
            let payAddress = [];
            for (let i = 1; i < rowCount.length; i++) {
                let data = findAll('td', rowCount[i]);
                payName.push(data[1].textContent.trim());
                payType.push(data[2].textContent.trim());
                payAddress.push(data[3].textContent.trim());
            }
            setCookieArray('payor-names', payName);
            setCookieArray('payor-types', payType);
            setCookieArray('payor-addresses', payAddress);
        });
        // Step 11 - Go to Fee Page
        clickPage('trust-account', ++n, '#Fees a');
        // Step 12 - Grab Data from user
        if (checkRun('trust-account', ++n) && checkExist('a#add')) {
            addCookie('outerframe-work', 5);
        }
    }, 500);
    
    AccelWaiter.addSingle('check-running-app', function() {
        // Check if Main Running app should quit. 
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
                addLog('We are in the Frame Checking');
                selectors.forEach(function(sel) {
                    if (findInFrame(find('#iframe-page-container'), sel) == null && !exists) {
                        addLog(checkExist('#iframe-page-container'));
                        addLog(find('#iframe-page-container'));
                        addLog(findInFrame(find('#iframe-page-container'), sel));
                        addLog("It doesn't exist in the Frame");
                        addLog(sel);
                        exists = false;
                    } else {
                        exists = true;
                    }
                });
            } else {
                alert("Wrong Page");
            }
            if (!exists) {
                addLog('Moved From Page');
                alert('Cancelling Automation Process');
                find('#iframe-page-container').contentWindow.location.reload();
                clearAllCookies();
            }
        }
    }, 500);
    
    AccelWaiter.addSingle('main-frame', function() {
        if (checkExist('#iframe-page-container')) {
            // Step 5
            if (getCookie('outerframe-work') == '5' && checkExist('#display-steps') && !checkExist('#fee-page')) {
                find('#display-steps').style.display = 'none';
                displayMessage('Trust Account Deposit', ['Please Enter the Deposit information.']);
                if (checkExist('#gray-overlay') && checkCookie('ticket-number')) {
                    // Creating Fee Data Div
                    // Grab Cookie Data
                    let ticketNum = getCookie('ticket-number');
                    let feeNames = getCookieArray('fee-names');
                    let feeCodes = getCookieArray('fee-codes');
                    let feeUnits = getCookieArray('fee-units');
                    let feeMulti = getCookieArray('fee-multiplier');
                    // Create Tags
                    let mainDiv = find('#display-main-div');
                    let feeDiv = createTagAppend(mainDiv, 'div', 'fee-page');
                    feeDiv.style.width = '100%';
                    feeDiv.style.height = '600px';
                    feeDiv.style.display = 'none';
                    let feeTable = createTagAppend(feeDiv, 'table', 'fee-table');
                    let headerTr = createTagAppend(feeTable, 'tr', '', 'header-row');
                    createTagAppend(headerTr, 'th', '', '', 'Fee Name');
                    createTagAppend(headerTr, 'th', '', '', 'Fee Code');
                    createTagAppend(headerTr, 'th', '', '', 'Fee Amount');
                    createTagAppend(headerTr, 'th', '', '', '');
                    createTagAppend(headerTr, 'th', '', '', 'Notes');
                    for (let i = 0; i < feeNames.length; i++) {
                        let tr = createTagAppend(feeTable, 'tr');
                        createTagAppend(tr, 'td', '', 'fee-name', feeNames[i]);
                        createTagAppend(tr, 'td', '', 'fee-code', feeCodes[i]);
                        let td = createTagAppend(tr, 'td');
                        createTagAppend(td, 'input', 'amount' + i + '-input');
                        createTagAppend(tr, 'td', '', 'fee-unit', feeUnits[i]);
                        createTagAppend(tr, 'td', '', 'fee-notes', 'Notes:');
                        td = createTagAppend(tr, 'td');
                        createTagAppend(td, 'input', 'notes' + i + '-input');
                    }                    
                    
                    // Grab Data
                    let methodShow = getCookieArray('method-show');
                    let methodRequired = getCookieArray('method-required');
                    let payNames = getCookieArray('payor-names');
                    let payTypes = getCookieArray('payor-types');
                    let payAddr = getCookieArray('payor-addresses');
                    // Create Payment Div
                    let payDiv = createTagAppend(mainDiv, 'div', 'pay-page');
                    payDiv.style.width = '100%';
                    payDiv.style.height = '600px';
                    // Create Method, Amount, Received, and Payor group
                    let payTable = createTagAppend(payDiv, 'table', 'pay-table');
                    headerTr = createTagAppend(payTable, 'tr', '', 'header-row');
                    createTagAppend(headerTr, 'th', '', 'pay-required', 'Method');
                    createTagAppend(headerTr, 'th', '', 'pay-required', 'Amount');
                    createTagAppend(headerTr, 'th', '', 'pay-required', 'Received');
                    createTagAppend(headerTr, 'th', '', 'pay-required', 'Payor');
                    // Payment Method
                    let tr = createTagAppend(payTable, 'tr');
                    let td = createTagAppend(tr, 'td');
                    let payMethod = createTagAppend(td, 'select', 'pay-method');
                    createTagAppend(payMethod, 'option', '', '', '--Select--').selected = true;
                    createTagAppend(payMethod, 'option', '', '', 'Cash').value = 'Cash';
                    createTagAppend(payMethod, 'option', '', '', 'Check').value = 'Check';
                    createTagAppend(payMethod, 'option', '', '', 'Credit Card').value = 'Credit Card';
                    // Amount Input
                    td = createTagAppend(tr, 'td');
                    createTagAppend(td, 'input', 'pay-amount');
                    // Received Select
                    td = createTagAppend(tr, 'td');
                    let payReceived = createTagAppend(td, 'select', 'pay-received');
                    createTagAppend(payReceived, 'option', '', '', '--Select--').selected = true;
                    createTagAppend(payReceived, 'option', '', '', 'In Person').value = 'In Person';
                    createTagAppend(payReceived, 'option', '', '', 'Mail').value = 'Mail';
                    createTagAppend(payReceived, 'option', '', '', 'PayGov').value = 'PayGov';
                    // Payor Select
                    td = createTagAppend(tr, 'td');
                    let paySelect = createTagAppend(td, 'select', 'pay-payor');
                    payNames.forEach(function (name) {
                        createTagAppend(paySelect, 'option', '', '', name).value = name;
                    });
                    
                    // Creating Payor Table
                    payTable = createTagAppend(payDiv, 'table', 'payor-table');
                    headerTr = createTagAppend(payTable, 'tr', '', 'header-row');
                    createTagAppend(headerTr, 'th', '', '', 'Name');
                    createTagAppend(headerTr, 'th', '', '', 'Type');
                    createTagAppend(headerTr, 'th', '', '', 'Address');
                    tr = createTagAppend(payTable, 'tr');
                    createTagAppend(tr, 'td', 'payor-name', '', 'NONE');
                    createTagAppend(tr, 'td', 'payor-type', '', 'NONE');
                    createTagAppend(tr, 'td', 'payor-address', '', 'NONE');
                    
                    // Create Extra Inputs
                    payTable = createTagAppend(payDiv, 'table', 'extra-table');
                    headerTr = createTagAppend(payTable, 'tr', '', 'header-row');
                    createTagAppend(headerTr, 'th', '', 'pay-reference', 'Reference #');
                    createTagAppend(headerTr, 'th', '', 'pay-check-number', 'Check Number');
                    createTagAppend(headerTr, 'th', '', 'pay-checkholder', "Check Holder's Name");
                    createTagAppend(headerTr, 'th', '', 'pay-cc-auth', 'CC Auth. Code');
                    tr = createTagAppend(payTable, 'tr');
                    td = createTagAppend(tr, 'td', '', 'pay-reference');
                    createTagAppend(td, 'input', 'pay-reference');
                    td = createTagAppend(tr, 'td', '', 'pay-check-number');
                    createTagAppend(td, 'input', 'pay-check-number');
                    td = createTagAppend(tr, 'td', '', 'pay-checkholder');
                    createTagAppend(td, 'input', 'pay-checkholder');
                    td = createTagAppend(tr, 'td', '', 'pay-cc-auth');
                    createTagAppend(td, 'input', 'pay-cc-auth');
                    
                    // OnChange for Payment Method
                    payMethod.addEventListener('onchange', function() {
                        let method = find('#pay-method');
                        if (method.value == 'Cash') {
                            findAll('.pay-reference').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            findAll('.pay-check-number').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            findAll('.pay-checkholder').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            findAll('.pay-cc-auth').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            removeClass(find('th.pay-reference'), 'pay-required');
                            removeClass(find('th.pay-cc-auth'), 'pay-required');
                            removeClass(find('th.pay-check-number'), 'pay-required');
                            removeClass(find('th.pay-checkholder'), 'pay-required');                            
                        } else if (method.value == 'Check') {
                            findAll('.pay-reference').forEach(function (el) {
                                el.style.display = '';
                            });
                            findAll('.pay-check-number').forEach(function (el) {
                                el.style.display = '';
                            });
                            findAll('.pay-checkholder').forEach(function (el) {
                                el.style.display = '';
                            });
                            findAll('.pay-cc-auth').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            find('th.pay-check-number').addClass('pay-required');
                            find('th.pay-checkholder').addClass('pay-required');
                            removeClass(find('th.pay-reference'), 'pay-required');
                            removeClass(find('th.pay-cc-auth'), 'pay-required');
                        } else if (method.value == 'Credit Card') {
                            findAll('.pay-reference').forEach(function (el) {
                                el.style.display = '';
                            });
                            findAll('.pay-check-number').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            findAll('.pay-checkholder').forEach(function (el) {
                                el.style.display = 'none';
                            });
                            findAll('.pay-cc-auth').forEach(function (el) {
                                el.style.display = '';
                            });
                            removeClass(find('th.pay-check-number'), 'pay-required');
                            removeClass(find('th.pay-checkholder'), 'pay-required');
                            find('th.pay-reference').addClass('pay-required');
                            find('th.pay-cc-auth').addClass('pay-required');
                        }
                    });
                    // OnChange for Payor Select
                    paySelect.addEventListener('onchange', function() {
                        let payNames = getCookieArray('payor-names');
                        let payTypes = getCookieArray('payor-types');
                        let payAddr = getCookieArray('payor-addresses');
                        let payor = find('select#pay-payor');
                        for (let i = 0; i < payNames.length; i++) {
                            if (payor.value == payNames[i]) {
                                find('#pay-name').textContent = payNames[i];
                                find('#pay-type').textContent = payTypes[i];
                                find('#pay-address').textContent = payAddr[i];
                            }
                        }
                    });
                    
                    // Set up Bottom Section
                    let overlay = find('#display-message');
                    overlay.style.top = '5%';
                    overlay.style.padding = '2%';
                    overlay.style.left = '10%';
                    overlay.style.width = '80%';
                    remove('#close-button');
                    let buttonArea = find('#button-area');
                    createTagAppend(buttonArea, 'button', 'cancel-button', '', 'Cancel', 'width: 25%; font-size: 18px;').addEventListener('click', function () {
                        clearAllCookies();
                        remove('#display-message');
                    });
                    createTagAppend(buttonArea, 'button', 'payment-button', '', 'Payment Page', 'width: 25%; font-size: 18px;').addEventListener('click', function () {
                        find('#fee-page').style.display = 'none';
                        find('#payment-button').disabled = true;
                        find('#fee-button').disabled = false;
                        find('#pay-page').style.display = '';
                    });
                    find('#payment-button').disabled = true;
                    createTagAppend(buttonArea, 'button', 'fee-button', '', 'Fees Page', 'width: 25%; font-size: 18px;').addEventListener('click', function () {
                        find('#fee-page').style.display = '';
                        find('#pay-page').style.display = 'none';
                        find('#payment-button').disabled = false;
                        find('#fee-button').disabled = true;
                    });
                    createTagAppend(buttonArea, 'button', 'deposit-button', '', 'Deposit', 'width: 25%; font-size: 18px;').addEventListener('click', function () {
                        addCookie('check-data-step-5', "check-data-fee");
                    });
                    addCookie('outerframe-done', true);
                }
            } else if (getCookie('outerframe-work') == '5' && checkExist('#fee-page') && getCookie('check-data-step-5') == 'data-good') {
                remove('#display-message');
                find('#display-steps').style.display = '';
                addCookie('trust-account-run', 6);
            } else if (getCookie('outerframe-work') == '5' && checkExist('#fee-page')) {
                // Remove All Stars
                findAll('.span-required').forEach(function (el) {
                    remove(el);
                });
                // Add Star for Required Headers
                findAll('th.pay-required').forEach(function (el) {
                    createTagAppend(el, 'span', '', 'span-required', '*').style.color = 'red';
                });
            }
            
            // Display Final Display when Automation is done
            if (getCookie('display-final-message') == 'true' && !checkExist('#display-message')) {
                while (checkExist('#display-steps')) {
                    remove('#display-steps');
                }
                let data = [];
                data.push('Ticket #: ' + getCookie('ticket-number'));
                data.push('Deposit Amount: $' + getCookie('TotalAmount'));
                let feeNums = getCookieArray('FeeInvoiceNumbers');
                if (feeNums.length > 1) {
                    let text = "Fee Invoice #'s: ";
                    for (let i = 0; i < feeNums.length; i++) {
                        if (i < feeNums.length - 1) {
                            text += feeNums[i] + ', ';
                        } else {
                            text += feeNums[i];
                        }
                    }
                    data.push(text);
                } else {
                    data.push('Fee Invoice #: ' + feeNums[1]);
                }
                data.push('Payment Invoice #: ' + getCookie('PayInvoiceNumber'));
                data.push('Receipt #: ' + getCookie('ReceiptNumber'));
                displayMessage('Deposit Successful', data);
            }
            
            // Grab Current Ticket Frame
            if (getCookie('grab-ticket-number') == 'true') {
                addCookie('ticket-number', find('h1.r-id', getActiveDiv()).textContent.trim());
                addCookie('grab-ticket-number', false);
                let frames = findAll('#iframe-page-container');
                for (let i = 0; i < frames.length; i++) {
                    frames[0].setAttribute('id', ('iframe-page-container' + i));
                }
                find('iframe', getActiveDiv()).setAttribute('id', 'iframe-page-container');
            }
            
            // Display Gray Frame Hiding the Screen
            if (getCookie('gray-overlay-show') == 'true') {
                if (!checkExist('#display-steps') && getCookie('display-final-message') != 'true') {
                    displayStepScreen();
                } else if (getCookie('display-steps') == 'true') {
                    find('#display-steps').style.display = '';
                }
                addGrayOverlay();
            } else {
                hideGrayOverlay();
                if (checkExist('#display-steps')) {
                    find('#display-steps').style.display = 'none';
                }
            }
            if (checkExist('#display-steps') && getCookie('update-steps') == 'true') {
                updateStepScreen(getCookie('display-step-number'), getCookie('display-step-message'));
                addCookie('update-steps', false);
            }
            
            // Hide the Outer Frames
            if (getCookie('outer-frame-display') == 'false' && find('#appbar').style.display != 'none') {
                find('.aa-nav-bar').style.display = 'none';
                find('div.record-header').style.display = 'none';
                find('#appbar').style.display = 'none';
            } else if (getCookie('outer-frame-display') == 'true' && find('#appbar').style.display != '') {
                find('.aa-nav-bar').style.display = '';
                find('div.record-header').style.display = '';
                find('#appbar').style.display = '';
            }
            
            // Display Error Message to User
            if (checkExist('#iframe-page-container'), getActiveDiv()) {
                if (getCookie('error-message-show') == 'true' && !checkExist('#error-info')) {
                    displayErrorList(getCookie('error-message-text'));
                }
            }
        }
    }, 100);
    
    AccelWaiter.addSingle('all-frames', function() {
        // Replace Accela Icon
        let imgSrc = 'https://github.com/PW-CSullivan/PWScripts/blob/main/Accela%20Trakit%201.png?raw=true';
        let iconSrc = 'https://github.com/PW-CSullivan/PWScripts/blob/main/Accela%20Trakit%201.ico?raw=true';
        let icon = findByAttribute('link', 'href', 'favicon.ico');
        if (icon) {
            icon.href = iconSrc;
        }
        if (checkExist('i.accelicons-accela-mark-new')) {
            let header = find('form.contact-address p-header');
            let icon = find('i.accelicons-accela-mark-new');
            createTagBefore(header, 1, 'img', 'my-icon', '', '', 'width: 100px; height: 100px;').src = imgSrc;
            remove(icon);
        } else if (!checkExist('#my-icon') && findByAttribute('img', 'src', 'assets/images/accela-logo-mark.svg')) {
            let img = findByAttribute('img', 'src', 'assets/images/accela-logo-mark.svg');
            img.src = imgSrc;
            img.id = 'my-icon';
            img.style = 'width: 30px; height: 30px;';
        }
        
        // Clear Cookies on Refresh
        if (checkURL("https://butteco-test-av.accela.com/portlets/web/en-us/#/core/tasks")) {
            //alert('Main Page');
            console.log("Need to Clear Cookies");
            clearAllCookies();
        }
        
        // When Cloning Records Auto Select Public Works
        if (checkURL("https://butteco-test-av.accela.com/portlets/picker/capTypePickerSelector.do") &&
           findByAttribute('li', 'data-value', 'Amendments')) {
            findByText('a', 'PublicWorks').click();
            sleep(250).then(() => {
                addClass(findByAttribute('li', 'data-value', 'Public Works'), 'expand');
            });
        }
    });
    
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
                    //addLog(el.parentElement.id);
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
    
    function displayStepScreen() {
        let loadGif = 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Loading_2.gif?20170503175831';
        let checkPng = 'https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/check-square-blue-512.png';
        addCookie('gray-overlay-show', true);
        if (checkExist('#gray-overlay')) {
            let overlay = createTagAppend(find('#gray-overlay'), 'div', 'display-steps');
            overlay.style.position = 'fixed';
            overlay.style.top = '25%';
            overlay.style.padding = '2%';
            overlay.style.left = '25%';
            overlay.style.width = '50%';
            overlay.style.height = 'Auto';
            overlay.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // Gray with 50% opacity
            overlay.style.zIndex = '9999'; // Ensure it's on top
            createTagAppend(overlay, 'h1', '', '', 'Trust Account Deposit', 'text-align: center;');
            createTagAppend(overlay, 'hr');
            let table = createTagAppend(overlay, 'table', 'step-table');
            addSteptoScreen(1, 'Check for Default Trust Account.');
            addSteptoScreen(2, 'Make sure there are currently no NEW fee items.');
            addSteptoScreen(3, 'Grab Payment Info for Trust Account Deposit.');
            addSteptoScreen(4, 'Create Fee Item for Deposit into Trust Account.');
            addSteptoScreen(5, 'Invoice the Fee that we just Created.');
            addSteptoScreen(6, 'Void the Invoice just Created.');
            addSteptoScreen(7, 'Invoice the Voided Fee Item to Credit the Account.');
            addSteptoScreen(8, 'Grab the Credited Invoice Number.');
            addSteptoScreen(9, 'Create Payment to Trust Account.');
            addSteptoScreen(10, 'Refund the Payment to Deposit into Trust Account.');
            createTagAppend(overlay, 'hr');
        }
    }
    
    function addSteptoScreen(stepNumber, message) {
        let loadGif = 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Loading_2.gif?20170503175831';
        if (checkExist('#iframe-page-container')) {
            if (checkExist('#step-table')) {
                let table = find('#step-table');
                let tr = createTagAppend(table, 'tr', 'step-' + stepNumber);
                let td = createTagAppend(tr, 'td', '', '', '', 'width: 20px; height: 20px;');
                let img = createTagAppend(td, 'img', '', 'step-' + stepNumber, '', 'width: 20px; height: 20px;');
                img.src = loadGif;
                td = createTagAppend(tr, 'td');
                createTagAppend(td, 'p', '', 'step-' + stepNumber, stepNumber + '. ' + message, 'margin: 0px;');
            }
        }
    }
    
    function updateStepScreen(stepNumber, message='') {
        let checkPng = 'https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/check-square-blue-512.png';
        if (checkExist('#iframe-page-container')) {
            for (let i = 1; i <= stepNumber; i++) {
                if (checkExist('#step-table') && checkExist('#step-' + i)) {
                    let img = find('img.step-' + i);
                    img.src = checkPng;
                }
            }
            if (message != '') {
                find('p.step-' + stepNumber).textContent = message;
                addCookie('display-step-message', '');
            }
        } else {
            if (message != '') {
                addCookie('display-step-message', message);
            }
            addCookie('display-step-number', stepNumber);
            addCookie('update-steps', true);
        }
    }
    
    function displayMessage(title, messages) {
        addCookie('gray-overlay-show', true);
        if (checkExist('#gray-overlay') && !checkExist('#display-message')) {
            let overlay = createTagAppend(find('#gray-overlay'), 'div', 'display-message');
            overlay.style.position = 'fixed';
            overlay.style.top = '25%';
            overlay.style.padding = '2%';
            overlay.style.left = '34%';
            overlay.style.width = '33%';
            overlay.style.height = 'Auto';
            overlay.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // Gray with 50% opacity
            overlay.style.zIndex = '9999'; // Ensure it's on top
            createTagAppend(overlay, 'h1', '', '', title, 'text-align: center;');
            createTagAppend(overlay, 'hr');
            messages.forEach(function (text) {
                createTagAppend(overlay, 'p', '', '', text);
            });
            createTagAppend(overlay, 'div', 'display-main-div');
            createTagAppend(overlay, 'hr');
            let buttonArea = createTagAppend(overlay, 'div', 'button-area');
            let close = createTagAppend(buttonArea, 'button', 'close-button', '', 'Close', 'width: 100%; font-size: 18px;');
            close.addEventListener('click', function() {
                clearAllCookies();
                //find('#iframe-page-container').contentWindow.location.reload();
                remove('#display-message');
            });
            return close;
        }
    }
    
    function displayErrorList(message) {
        // My Step 11 to 12 is Step 8
        // my stop 14 is 9
        addCookie('gray-overlay-show', true);
        if (checkExist('#gray-overlay')) {
            if (!checkExist('#error-info')) {
                let overlay = createTagAppend(find('#gray-overlay'), 'div', 'error-info');
                overlay.style.position = 'fixed';
                overlay.style.top = '25%';
                overlay.style.padding = '2%';
                overlay.style.left = '34%';
                overlay.style.width = '33%';
                overlay.style.height = 'Auto';
                overlay.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // Gray with 50% opacity
                overlay.style.zIndex = '9999'; // Ensure it's on top
                createTagAppend(overlay, 'h1', '', '', 'Error List', 'text-align: center;');
                // Add Error Info
                let step = 0;
                let mystep = getCookie('trust-account-run');
                let errorText = "";
                if (mystep < 10) {
                    errorText = 'You can Close window and try again.';
                } else if (mystep == 10) {
                    errorText = 'Please Delete the Fee that has no invoice number and try again.';
                } else {
                    errorText = 'To continue with your Deposit click the link below and go to step ';
                    if (mystep == 11 || mystep == 12) {
                        step = 8;
                    } else if (mystep == 14) {
                        step = 9;
                    } else if (mystep >= 15 && mystep <= 17) {
                        step = 10;
                    } else if (mystep == 18) {
                        step = 11;
                    } else if (mystep >= 19 && mystep <= 25) {
                        step = mystep - 6;
                    } else if (mystep >= 26 && mystep <= 29) {
                        step = mystep + 4;
                    } else {
                        step = 34;
                    }
                    // Add end of user error text.
                    if (step < 20) {
                        errorText += step.toString() + '. You can skip steps 20 to 28';
                    } else {
                        errorText += step.toString();
                    }
                    errorText += ' then finish up to step 34.';
                }
                if (errorText.length > 45) {
                    createTagAppend(overlay, 'p', '', '', errorText);
                } else {
                    let center = createTagAppend(overlay, 'center');
                    createTagAppend(center, 'p', '', '', errorText);
                }
                // Create Guide Link
                let center = createTagAppend(overlay, 'center');
                let alink = createTagAppend(center, 'a', '', '', 'Click Me to Open Guide');
                alink.setAttribute('href', 'https://buttecountyca.sharepoint.com/:w:/s/PW/EdMqgw3AAwVMopAO6VmVtx4BZynjOAPufzVXfnxOCpy8CQ?email=PWSUGrp-Users%40buttecounty.net&e=KQJCbf');
                alink.setAttribute('target', '_blank');
                createTagAppend(overlay, 'hr');
                createTagAppend(overlay, 'p', '', '', 'Please click the text area below to copy the data inside and email this to IT.');
                let textarea = createTagAppend(overlay, 'textarea', 'error-data');
                textarea.style.width = '100%';
                textarea.style.height = '350px';
                textarea.style.margin = '0px';
                textarea.style.resize = 'none';
                textarea.readOnly = true;
                createTagAppend(overlay, 'hr');
                let close = createTagAppend(overlay, 'button', 'close-button', '', 'Close', 'width: 100%; font-size: 18px;');
                close.addEventListener('click', function() {
                    clearAllCookies();
                    find('#iframe-page-container').contentWindow.location.reload();
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
        let safety = true;
        if (typeof(selector) == "string") {
            el = find(selector);
        } else {
            el = selector;
        }
        while (el != null && el.tagName != 'TABLE') {
            let temp = el;
            try {
                el = el.parentElement;
            } catch {
                el = temp;
                break;
            }
        }
        try {
            return el.parentElement;
        } catch {
            return el;
        }
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
            addLog('Step - ' + number);
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
            addLog('Step - ' + number);
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
    
    function addLog(text) {
        //let messages = getCookieArray('console-messages');
        if (text == null) {
            text = 'null';
        } else {
            text = text.toString();
        }
        let messages = getCookieArray('console-messages');
        let found = false;
        let index = 0;
        let end = 0;
        for (let i = 0; i < messages.length; i++) {
            end = messages[i].indexOf(':');
            if (messages[i].substring(end + 2) == text) {
                found = true;
                index = i;
                i = messages.length;  // Break
            }
        }
        if (found) {
            let start = 6;
            let count = messages[index].substring(start, end);
            count++;
            messages[index] = 'Count ' + count + ': ' + text;
        } else {
            messages.push('Count 1: ' + text);
        }
        setCookieArray('console-messages', messages);
        //console.log(text);
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
            //console.log(cname + "=" + cvalue + ";" + expires + ";path=/");
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
            setCookie(cname + '.type', typeof carray[0]);
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
                let data = getCookie(getCookie(cname + "." + i.toString()));
                let dataType = getCookie(cname + '.type');
                if (dataType == 'number') {
                    data = Number(data);
                } else if (dataType == 'boolean') {
                    data = Boolean(data);
                }
                blankArray.push(data);
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
    
    const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
    });
    
    function checkExist(css, element=false) {
        if (element === false) {
            if (document.querySelector(css)) {
                return true;
            }
            return false;
        } else if (typeof element == 'string') {
            if (document.querySelector(css) && document.querySelector(element)) {
                if (findAll(css, element).length > 0) {
                    return true;
                }
                return false;
            }
        } else if (element != null && element.querySelector(css)) {
            return true;
        }
        return false;
    }
    
    function findAll(css, element=false) {
        if (element !== false) {
            if (typeof element == 'string') {
                element = find(element);
            }
            return element.querySelectorAll(css);
        } else {
            return document.querySelectorAll(css);
        }
    }
    
    function find(css, element=false) {
        if (element !== false) {
            if (typeof element == 'string') {
                element = find(element);
            }
            return element.querySelector(css);
        } else {
            return document.querySelector(css);
        }
    }
    // Your code here...
})();
