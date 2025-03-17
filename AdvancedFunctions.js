// ==UserScript==
// @name         Advanced Functions
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Used with my other scripts for advanced forms of JQuery Searches
// @author       Christopher Sullivan
// @match        *
// @require      https://code.jquery.com/jquery-3.7.1.js
// @require      https://requirejs.org/docs/release/2.3.5/minified/require.js
// @downloadURL  https://github.com/PW-CSullivan/PWScripts/raw/main/AdvancedSearch.user.js
// @updateURL    https://github.com/PW-CSullivan/PWScripts/raw/main/AdvancedSearch.user.js
// @grant        none
// ==/UserScript==
/**
 * find
 * function to find an element by Css selector, if element is given
 * then will search within that element for element with the css selector.
 *
 * @param selector - String that's a css selector
 * @param element - Element object from document
 * @return JQuery Object
 */
function findSingle(selector, element=false) {
    if (element !== false) {
        return element.find(selector).first();
    } else if (typeof(selector) === "string") {
        return $(selector).first();
    }
    return selector.first();
}

/**
 * checkURL
 * function that checks to see if the given url is in the page url.
 *
 * @param url - String
 * @return Boolean
 */
function checkURL(url) {
    return document.location.href.includes(url);
}

/**
 * setField
 * function that will  update a field by either giving it text of by checking the box.
 * The etype is a string param that should either be 'input' for a text field or 'click'
 * for a check box. The text param is for if the element is a text field text will
 * will be a string for the text wanting to be put in the textfield. If
 * element is given an Element Object it will search within that Element to find the
 * element wanted.
 *
 * @param selector - Element Object or String CSS Selector
 * @param etype - Either 'input' or 'click'
 * @param text - Either String or Boolean
 * @param element - Element Object to search in
 */
function setField(selector, text, element=false) {
    var el = findSingle(selector, element);
    el.click();
    el.val(text);
}

/**
 * addTag
 * function that creates an element on the page at a given location and
 * appends that element then returns the created the element.
 *
 * @param loc - element to prepend to.
 * @param tag - the tag of the element
 * @param id - id of new element
 * @param el_class - class of new element
 * @param text - the inner text of the new element
 */
function addTag(loc, tag, id='', el_class='', text='', style='') {
    loc = findSingle(loc);
    var element = false;
    if (text != '') {
        element = loc.add(tag, text);
    } else {
        element = loc.add(tag);
    }
    if (id != '') {
        element.attr('id', id);
    }
    if (el_class != '') {
        element.addClass(el_class); 
    }
    if (style != '') {
        element.css(style);
    }
    loc.append(element);
    return element;
}

/**
 * replaceClass
 * function that replaces a specific class of an element.
 * 
 * @param loc - element to change class of.
 * @param org_class_name - the original class name to be replaced
 * @param new_class_name - the new class name to replace the original one
 */
function replaceClass(loc, org_class_name, new_class_name) {
    loc = findSingle(loc);
    if (loc.hasClass(org_class_name)) {
        loc.removeClass(org_class_name);
        loc.addClass(new_class_name);
    }
}

/**
 * itemInArray
 * function that checks to see if a given item matches one in an array.
 * 
 * @param item - The object to check to see if it exists in array.
 * @param array - The array to check against.
 * @return Bool
 */
function itemInArray(item, array) {
    for (var i = 0; i < array.length; i++) {
        if (item == array[i]) {
            return true;
        }
    }
    return false;
}
/**
 * createDropdown
 * function that creates a select dropdown list given a location and list of
 * strings for the title of the options. The value and title will be the same
 * value. ID and el_class are for the class of the select element.
 *
 * @param loc - Element to prepend to.
 * @param items - the array of strings used for the list
 * @param id - id of the select element
 * @param el_class - the class of the select element
 */
function createDropdown(loc, items, id='', el_class='') {
    var text = '';
    items.forEach(function(item) {
        text += '<option value="' + item + '">' + item + '</option>';
    });
    var dropdown = addTag(loc, 'select', id, el_class);
    dropdown.add(text);
}

/**
     * createEmptyTable
     * Function creates an empty Table in accela style and returns the table 
     * that was created.
     * 
     * @param loc - element to append to.
     * @param id - id of new table
     * @param el_class - class of new table
     * @param width - width attribute of new table
     * @param ignore - ignore attributte of new table
     * @return Tag Element - New table
     */
    function createEmptyTable(loc, id='', el_class='', width='', ignore='') {
        var table = createTagAppend(loc, "table", id, el_class);
        if (width != '') {
            table.setAttribute("width", width);
        }
        if (ignore != '') {
            table.setAttribute("ignore", ignore);
        }
        table.setAttribute("border", "0");
        table.setAttribute("cellpadding", "0");
        table.setAttribute("cellspacing", "0");
        var tbody = createTagAppend(table, "tbody");
        var tr = createTagAppend(tbody, "tr");
        createTagAppend(tr, "td");
        return table;
    }

/**
 * runAngularTrigger
 * function that gets around scope issues with chrome extensions.
 * adds the script that needs to be run to trigger an angular trigger on the page.
 * then removes the code.
 *
 * @param css - css selector inside the angular.element call
 * @param trigger - the name of the trigger in .triggerHandler
 */
function runAngularTrigger(css, trigger) {
    var code = "angular.element('" + css + "').triggerHandler('" + trigger + "');";
    addTag(findSingle('body'), 'script', 'angular', '', code).nodeType='text/javascript';
    $('#angular').remove();
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};
