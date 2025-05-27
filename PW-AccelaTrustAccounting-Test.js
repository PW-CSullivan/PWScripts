// ==UserScript==
// @name         PW-AccelaTrustAccounting-Test
// @namespace    http://tampermonkey.net/
// @version      0.0.6
// @description  Used for Accela CAMs Integration for Trust Accounting
// @author       Christopher Sullivan
// @match        https://butteco-test-av.accela.com/*
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/SearchElements.js
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/Waiter.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/PW-AccelaTrustAccounting-Test.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/PW-AccelaTrustAccounting-Test.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var allCookiesNames = [];
    var AccelWaiter = new Waiter();
    var url = window.location.href;
    var counter = 0;
    // Inner Screen
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
                    //addSteptoScreen(1, 'Check for Default Trust Account.');
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
                    //addSteptoScreen(1, 'Check for Default Trust Account.');
                    updateStepScreen(1);
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
    
    // Main Screen
    AccelWaiter.addSingle('final-message-display', function() {
        if (checkExist('#iframe-page-container')) {
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
        } else {
            //AccelWaiter.clearSingle('final-message-display');
        }
    }, 1000);
    
    // All Screens
    AccelWaiter.addSingle('replace-icon', function() {
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
    });
    
    // Main Frame
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
    
    // Inner Frame
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

    // All Frame
    // Reset all Cookies if at Home Page
    AccelWaiter.addSingle('cookie-reset-main-page', function() {
        if (checkURL("https://butteco-test-av.accela.com/portlets/web/en-us/#/core/tasks") &&
            getCookie('all-cookie-names') != '') {
                clearAllCookies();
        }
    });
    
    // All Frame
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
    
    // Main Frame
    // Gray Overlay of Screen
    AccelWaiter.addSingle('gray-overlay', function() {
        if (checkExist('#iframe-page-container') && getCookie('gray-overlay-show') == 'true') {
            if (!checkExist('#display-steps') && getCookie('display-final-message') != 'true') {
                displayStepScreen();
            } else {
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
            //updateStepScreen(getCookie('display-step-old-number'));
            updateStepScreen(getCookie('display-step-number'), getCookie('display-step-message'));
            addCookie('update-steps', false);
        }
    }, 100);
    
    // Main Frame
    // Hide the Outer display
    AccelWaiter.addSingle('outer-display-toggle', function() {
        if (checkExist('#iframe-page-container')) {
            if (getCookie('outer-frame-display') == 'false' && find('#appbar').style.display != 'none') {
                find('.aa-nav-bar').style.display = 'none';
                find('div.record-header').style.display = 'none';
                find('#appbar').style.display = 'none';
            } else if (getCookie('outer-frame-display') == 'true' && find('#appbar').style.display != '') {
                find('.aa-nav-bar').style.display = '';
                find('div.record-header').style.display = '';
                find('#appbar').style.display = '';
            }
        }
    }, 100);    
    
    // Main Frame
    AccelWaiter.addSingle('error-message', function() {
        if (checkExist('#iframe-page-container'), getActiveDiv()) {
            if (getCookie('error-message-show') == 'true' && !checkExist('#error-info')) {
                displayErrorList(getCookie('error-message-text'));
            }
        }
    });

    // Inner Frame
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
        if (checkRun('trust-account', ++n) && checkExist('#AccelaMainTable')) {
            if (findByText('td.portlet-section-body:nth-child(5)', 'Y', find('#AccelaMainTable'))) {
                updateStepScreen(1);
                //addSteptoScreen(2, 'Grab Payment Info for Deposit.');
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
                        updateStepScreen(2);
                        //addSteptoScreen(3, 'Create Fee for Deposit.');
                        setCookieArray('selectors', [''], -1);
                        find('#Fees a').click();
                    }
                });
                addClass(find('a#save'), 'my-click-added5');
            }
            counter = 0;
        }
        // Step 7 - 
        if (checkRun('trust-account', ++n) && checkExist('a#add')) {
            let index = getColumn('Balance');
            if (index != -1) {
                if (findByText('td.AlignL', 'NEW') != null) {
                    // Skip the Creation of Fee Item
                    alert("There is already a New Fee item. Please delete the fee item and try again.");
                    clearAllCookies();
                    location.reload();
                } else {
                    find('a#add').click();
                    addCookie('trust-account-run', 8);
                }
            }
        }
        // Step 8 - Add Fee Page waiting for info to be filled out
        if (checkRun('trust-account', ++n) && checkExist('a#acsubmit')) {
            if (!checkExist('a.my-click-added')) {
                addCookie('gray-overlay-show', false);
                addCookie('step-run', ++stepRun);
                setCookieArray('selectors', ['a#acsubmit']);
                let subButton = find('#acsubmit');
                subButton.parentElement.style = 'display: none;';
                removeButton('Menu');
                removeButton('Help');
                let inputs = findAll('td.portlet-section-body input');
                inputs.forEach(function (el) {
                    el.addEventListener('keydown', function(event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            find('#my-submit').click();
                        }
                    });
                });
                //addCookie('frame-url', window.location.href);
                addMenuButton('Submit', 'my-submit', function() {
                    //addGrayOverlay();
                    let values = [];
                    let inputs = findAll('td.portlet-section-body input');
                    inputs.forEach(function(inp) {
                        if (inp.getAttribute('name').includes('Quantity')) {
                            values.push(inp);
                        }
                    });
                    let count = 0;
                    let total = getCookie('TotalAmount').replace('.00', '');
                    let indexs = [];
                    for (let i = 0; i < values.length; i++) {
                        if (values[i].value != '') {
                            count++;
                            indexs.push(i);
                        }
                    } if (count == 0) {
                        alert('Please put in a fee amount to continue.');
                    } else {
                        let feeMults = [];
                        let feeTotals = [];
                        indexs.forEach(function (i) {
                            feeMults.push(findByAttribute('input', 'name', 'value(FormulaName,' + i + ')').value);
                            feeTotals.push(cashToNumber(values[i].value));
                        });
                        let testTotal = 0;
                        for (let i = 0; i < feeTotals.length; i++) {
                            testTotal += feeMults[i] * feeTotals[i];
                        }
                        if (total != testTotal) {
                            let text = "Total Deposit doesn't match Fee Values.";
                            text += '\n  Deposit: $' + total + '.00';
                            text += '\nFee Total: $' + testTotal + '.00';
                            alert(text);
                        } else {
                            addCookie('gray-overlay-show', true);
                            addCookie('Total', testTotal);
                            addCookie('Fee-Count', count);
                            updateStepScreen(3);
                            //addSteptoScreen(4, 'Invoice the Fee that we just Created.');
                            addCookie('step-run', 0);
                            stepRun = 0;
                            setCookieArray('selectors', [''], -1);
                            addCookie('trust-account-run', 9);
                            find('#acsubmit').click();
                        }
                    }
                });
                addClass(find('a#acsubmit'), 'my-click-added');
            }
            counter = 0;
        }
        // Step 9 - Click Check box of Fee then Invoice it
        if (checkRun('trust-account', ++n) && checkExist('#row1') && checkExist('a#invoice')) {
            if (findByText('td.AlignL', 'NEW')) {
                let rows = findAllByText('td.AlignL', 'NEW');
                let pRows = [];
                rows.forEach(function(r) {
                    pRows.push(r.parentElement);
                });
                if (pRows.length == 0) {
                    alert('Looks like Accela had an issue creating the fee items. Please try again.');
                    clearAllCookies();
                    location.reload();
                } else {
                    pRows.forEach(function (row) {
                        setField(findByAttribute('input', 'type', 'checkbox', "", "", row), 'click', 'true');
                    });
                    find('a#invoice').click();
                    updateStepScreen(4);
                    //addSteptoScreen(5, 'Void the Invoice just Created.');
                    addCookie('user-error-message', '', -1);
                    sleep(250);
                }
            } else {
                counter = 0;
                addCookie('trust-account-run', 10);
            }
        }
        // Step 10
        orderList('trust-account', ++n, 'Invoice #');
        // Step 11 - Grab Invoice Number
        if (checkRun('trust-account', ++n) && checkExist('#row1') && checkExist('a#invoice')) {
            let table = find('#AccelaMainTable');
            let index = getColumn('Invoice');
            let selector = 'td:nth-child(' + index + ')';
            let pageNum = find('#page-navigator-input-id').value;
            let rowNum = 1;
            let rowSelect = 'tr#row' + rowNum;
            let text = 'F_';
            let found = false;
            if (checkExist(selector, rowSelect)) {
                text = find(selector, rowSelect).textContent.trim();
            }
            if (!text.includes('F_') && pageNum == 1 && checkExist('a.order_down')) {
                found = true;
            } else if (text.includes('F_' && pageNum == 1)) {
                // Click Invoice # to Sort order list up. 
                findByText('a', 'Invoice #', table).click();
            } else if (findByText('a', 'F_', table) && checkExist('a.order_up')) {
                while (!text.includes('F_') && !found) {
                    let nextRow = 'tr#row' + (rowNum + 1);
                    let nextTag = find(selector, nextRow);
                    if (nextTag.textContent.trim().includes('F_')) {
                        found = true;
                    } else {
                        text = nextTag.textContent.trim();
                    }
                }
            } else {
                pageNum++;
                find('#page-navigator-input-id').value = pageNum;
                find('#page-navigator-input-id').dispatchEvent(enterEvent);
            }
            if (found) {
                addCookie('FeeInvoiceNumber', text);
                updateStepScreen(6);
                addCookie('trust-account-run', 12);
            }            
        }
        // Step 12 - Go to Payments Page
        clickPage('trust-account', ++n, '#Payments a');
        // Step 13 - Pay payments page
        clickPage('trust-account', ++n, 'a#pay');
        // Step 14 - Go to Payor Page
        clickPage('trust-account', ++n, findByAttribute('input', 'alt', 'Select Payor'));
        // Step 15 - Select Payor
        setRun('trust-account', ++n, 'a#acsubmit', function() {
            updateStepScreen(7);
            let payor = getCookie('Payor');
            let index = 0;
            for (let i = 0; i < 10; i++) {
                let idName = '#paidToName' + i;
                if (checkExist(idName) && find(idName).value == payor) {
                    updateStepScreen(8);
                    find('#ac360_list_id', find(idName).parentElement).click();
                    break;
                }
            }
        });
        // Step 16 - Fill Pay Page
        setRun('trust-account', ++n, 'a#save', function() {
            updateStepScreen(8);
            let method = getCookie('Method');
            changeValue('input', 'data-label', 'Amount', 'Amount');
            changeValue('select', 'id', 'value(method)', method);
            changeValue('select', 'id', 'value(receivedType)', 'Received');
            let comment = getCookie('Comment');
            let feeNums = getCookieArray('FeeInvoiceNumbers');
            if (feeNums.length > 1) {
                comment += "\nFee Invoice #'s: ";
                for (let i = 0; i < feeNums.length; i++) {
                    if (i < feeNums.length - 1) {
                        comment += feeNums[i] + ', ';
                    } else {
                        comment += feeNums[i];
                    }
                }
            } else {
                comment += '\nFee Invoice #: ' + feeNums[0];
            }
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
            updateStepScreen(9);
        });
        // Step 17 - Check if Receipt was generated or not. 
        if (checkRun('trust-account', ++n) && (checkExist('input#listCount') || checkExist('a#generateReceipt'))) {
            if (checkExist('a#generateReceipt')) {
                updateStepScreen(10);
                addCookie('trust-account-run', 18);
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
                    updateStepScreen(10);
                    addCookie('trust-account-run', 18);
                    counter = 0;
                }
            }
        }
        // Step 18 - Get Pay Invoice Number and Receipt Number
        if (checkRun('trust-account', ++n) && checkExist('a#a_Refund')) {
            let trs = findAll('tr', find('#InvoicesTableId'));
            let td = findByAttribute('td', 'headers', 'IVC IVCNumber', '', '', trs[trs.length - 1]);
            addCookie('PayInvoiceNumber', find('a', td).textContent.trim());
            let table = find('#transactionTableId');
            addCookie('ReceiptNumber', find('a', table).textContent.trim());
            find('#Fees a').click();
            updateStepScreen(11, '11. Payment Invoice: ' + getCookie('PayInvoiceNumber') + ' | Receipt: ' + getCookie('ReceiptNumber') + '.');
            //addSteptoScreen(5, 'Void the Fee Item Created Earlier.');
            //window.location.reload();
            addCookie('trust-account-run', 19);
        }
        // Step 19
        orderList('trust-account', ++n, 'Invoice #');
        // Step 20 - Void Fee Start
        if (checkRun('trust-account', ++n) && checkExist('tr#row1')) {
            let feeNums = getCookieArray('FeeInvoiceNumbers');
            let table = find('#AccelaMainTable');
            if (findByText('a', feeNums[0], table)) {
                feeNums.forEach(function(fee) {
                    let feeTag = findByText('a', fee, table);
                    let row = feeTag.parentElement.parentElement;
                    setField(find('#ac360_list_id', row), 'click', 'true');
                });
                let bVoid = find('a#void');
                find('font', bVoid).innerText = 'VOID ME';
                find('font', bVoid).style = 'font-size: 48px;';
                addCookie('trust-account-run', 21);
            } else {
                let pageNum = find('#page-navigator-input-id').value;
                pageNum++;
                find('#page-navigator-input-id').value = pageNum;
                find('#page-navigator-input-id').dispatchEvent(enterEvent);
            }
        }
        // Step 21
        if (checkRun('trust-account', ++n)) {
            //alert('Clicking Void');
            //addLog('Clicking Void');
            setCookieArray('selectors', ['a#void']);
            if (checkExist('a#void')) {
                addCookie('outer-frame-display', false);
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
                addCookie('outer-frame-display', false);
                addCookie('gray-overlay-show', false);
                alert("Please Click the button 'VOID ME'");
                //find('a#void input').form.submit();
                updateStepScreen(12);
                //addSteptoScreen(6, 'Invoice the Voided Fee Item to Maintain Records.');
            }
            counter = 0;
            if (checkExist('#a_submitBtn')) {
                addCookie('gray-overlay-show', true);
                addCookie('outer-frame-display', true);
                addCookie('trust-account-run', 22);
            }
        }
        // Step 22 - Void Fee Popup
        if (checkRun('trust-account', ++n) && checkExist('#a_submitBtn')) {
            addCookie('gray-overlay-show', true);
            changeValue('select', 'id', 'value(reason)', 'Trust Deposit');
            let comment = 'Trust Account Deposit';
            comment += '\nPayment Invoice #: ' + getCookie('PayInvoiceNumber');
            comment += '\nPayment Receipt #: ' + getCookie('ReceiptNumber');
            changeValue('textarea', 'id', 'value(comment)', comment);
            find('#a_submitBtn').click();
            sleep(500).then(() => {
                addCookie('trust-account-run', 23);
            });
        }
        // Step 23
        if (checkRun('trust-account', ++n) && checkExist('#AccelaMainTable')) {
            let table = find('#AccelaMainTable');
            let feeNums = getCookieArray('FeeInvoiceNumbers');
            if (findByText('a', feeNums[0], table)) {
                feeNums.forEach(function(fee) {
                    let feeTag = findByText('a', fee, table);
                    let row = feeTag.parentElement.parentElement;
                    setField(find('#ac360_list_id', row), 'click', 'true');
                });
                let invoiceBut = find('a#invoice');
                find('font', invoiceBut).innerText = 'INVOICE ME';
                find('font', invoiceBut).style = 'font-size: 48px;';
                addCookie('trust-account-run', 24);
            } else {
                let pageNum = find('#page-navigator-input-id').value;
                pageNum++;
                find('#page-navigator-input-id').value = pageNum;
                find('#page-navigator-input-id').dispatchEvent(enterEvent);
            }
        }
        // Step 24 - Invoice the Void
        if (checkRun('trust-account', ++n) && checkExist('tr#row1')) {
            updateStepScreen(14);
            //addSteptoScreen(7, 'Refund the Payment to apply that Payment to the Trust Account.');
            //find('a#invoice').click();
            //addCookie('trust-account-run', 26);
            setCookieArray('selectors', ['a#invoice']);
            if (checkExist('a#invoice')) {
                addCookie('outer-frame-display', false);
                removeButton('Menu');
                removeButton('Delete');
                removeButton('Void');
                removeButton('Invoice & Pay');
                removeButton('ReCalc');
                removeButton('Help');
                find('#utility-menu').style = 'display: none;';
                find('#feeItemTable').style = 'display: none;';
                find('#AccelaMainTable').style = 'display: none;';
                find('#pagingInfo').style = 'display: none;';
                find('a#add').style = 'display: none;';
                addCookie('outer-frame-display', false);
                addCookie('gray-overlay-show', false);
                alert("Please Click the button 'INVOICE ME'");
                //find('a#invoice').click();
                updateStepScreen(14);
                find('a#invoice').addEventListener('click', function() {
                    addCookie('gray-overlay-show', true);
                    addCookie('outer-frame-display', true);
                    addCookie('trust-account-run', 25);
                });
            }            
            counter = 0;          
        }
        // Step 25 - go to Payment page
        clickPage('trust-account', ++n, '#Payments a');
        // Step 26 - Refund Payment to Trust Accound
        clickPage('trust-account', ++n, 'a#a_Refund');
        // Step 27 - Go to Refund Page
        clickPage('trust-account', ++n, 'a#update');
        // Step 28 - Fill Out Refund Page
        setRun('trust-account', ++n, 'a#refund', function() {
            changeValue('select', 'id', 'value(reason)', 'Trust Account Deposit');
            changeValue('input', 'id', 'value(paymentAmount)', 'Amount');
            changeValue('select', 'id', 'value(paymentMethod)', 'Trust Account');
            sleep(500);
            updateStepScreen(16);
        });
        // Step 29 - Close Out
        if (checkRun('trust-account', ++n) && checkExist('a#pay')) {
            find('#TrustAccounts a').click();
            //addSteptoScreen(8, 'All Done.');
            updateStepScreen(18);
            addCookie('display-final-message', true);
            addCookie('running-app', 'none');
            //clearAllCookies();
        }
        if (counter == 20 && getCookie('running-app') == 'trust-account') {
            addLog('DISPLAY ERROR');
            addCookie('frame-url', document.location.href);
            addCookie('error-message-show', true);
            addCookie('error-message-text', "Counter = " + counter.toString());
            //displayErrorList("Counter = " + counter.toString());
            //clearAllCookies();
        }
        if (!checkExist('#iframe-page-container') && !checkExist('#walkme-native-functions') && 
            getCookie('running-app') == 'trust-account' && checkURL(getCookie('url-ticket-number')) && stepRun == 0) {
            counter++;
        } else if (!checkExist('#iframe-page-container') && !checkExist('#walkme-native-functions') && 
            getCookie('running-app') == 'trust-account' && 
                   checkURL('https://butteco-test-av.accela.com/portlets/fee/feeList.do') && 
                   stepRun == 0) {
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
            addSteptoScreen(2, 'Grab Payment Info for Deposit.');
            addSteptoScreen(3, 'Create Fee for Deposit.');
            addSteptoScreen(4, 'Invoice the Fee that we just Created.');
            addSteptoScreen(5, 'Void the Invoice just Created.');
            addSteptoScreen(6, 'Grab Invoice Number.');
            addSteptoScreen(7, 'Go to Payment Page to pay the Fee.');
            addSteptoScreen(8, 'Select Payor of Deposit.');
            addSteptoScreen(9, 'Fill in Payment Information.');
            addSteptoScreen(10, 'Check that Receipt was Generated.');
            addSteptoScreen(11, 'Grab Payment Invoice and Receipt Numbers.');
            addSteptoScreen(12, 'Void the Fee Item Created Earlier.');
            addSteptoScreen(13, 'Fill in the Void Fee Popup Menu.');
            addSteptoScreen(14, 'Invoice the Voided Fee Item to Maintain Records.');
            addSteptoScreen(15, 'Go to Payment Page to Refund the Payment.');
            addSteptoScreen(16, 'Fill in Refund Information.');
            addSteptoScreen(17, 'Go back to Trust Account Page.');
            addSteptoScreen(18, 'Verify that Payment was Applied.');
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
        if (checkExist('#gray-overlay')) {
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
            createTagAppend(overlay, 'hr');
            let close = createTagAppend(overlay, 'button', 'close-button', '', 'Close', 'width: 100%; font-size: 18px;');
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
        console.log(text);
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
        addLog('CLEARING COOKIES');
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
