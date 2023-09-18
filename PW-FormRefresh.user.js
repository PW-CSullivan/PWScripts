// ==UserScript==
// @name         Public Works Form Refresh
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Used to refresh the page for Public Works Laserfiche forms every 10 minutes if there is no data in the fields or if the same data is in the fields for the last 10 minutes. 
// @author       Christopher Sullivan
// @match        https://bc-forms/Forms/VehicleRepairRequest
// @require      https://raw.githubusercontent.com/PW-CSullivan/PWScripts/main/SearchElements.js
// @require      https://github.com/PW-CSullivan/PWScripts/raw/main/Waiter.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/PW-FormRefresh.user.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/PW-FormRefresh.user.js
// @grant        none
// ==/UserScript==

// Main function that runs on page load.
(function () {
    'use strict';
    var wait = new Waiter();
    var old_values = [];
    wait.addTable(function (table_number) {
        old_values = getFieldData();
        wait.clearTable(table_number);
    });
    console.log("HERE");
    console.log("Old Values: " + old_values.length);
	// Runs once every 10 minutes.
    wait.addSingle("Main", function () {
		var values = getFieldData();
		var different = false;
		if (old_values.length == values.length) {
			for (var i = 0; i < old_values.length; i++) {
				if (old_values[i] != values[i]) {
                    console.log("I: " + i);
					different = true;
					break;
				}
			}
		}
		if (!different) {
			//window.location.reload();
            console.log("REFRESH");
		} else {
			different = false;
			old_values = getFieldData();
		}
	}, 10000);
})();

function getFieldData() {
	var texts = [];
	var fields = findAll("input");
	for (var i = 0; i < fields.length; i++) {
		if (fields.type != "hidden" && !fields[i].readOnly) {
			texts.push(fields[i].value);
		}
	}
	return texts;
}
