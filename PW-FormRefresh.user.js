// ==UserScript==
// @name         Public Works Form Refresh
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Used to refresh the page for Public Works Laserfiche forms every 10 minutes if there is no data in the fields or if the same data is in the fields for the last 10 minutes. 
// @author       Christopher Sullivan
// @include      https://bc-forms/Forms/VehicleRepairRequest
// @require      https://raw.githubusercontent.com/PW-CSullivan/PWScripts/main/SearchElements.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/master/PW-FormRefresh.user.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/master/PW-FormRefresh.user.js
// @run-at document-idle
// @grant        none
// ==/UserScript==

// Main function that runs on page load.
(function () {
	var old_values = getFieldData();
	// Runs once every 10 minutes.
	var check_run = setInterval(function () {
		var values = getFieldData();
		var different = false;
		if (old_values.length == values.length) {
			for (var i = 0; i < old_values.length; i++) {
				if (old_values[i] != values[i]) {
					different = true;
					break;
				}
			}
		}
		if (!different) {
			window.location.reload();
		} else {
			different = false;
			old_values = getFieldData();
		}
	}, 600000);
});

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
