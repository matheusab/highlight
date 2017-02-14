/**
 * Created by bxo on 31/01/2017.
 */



function insertAt(string, index, substring) {
    return string.substr(0, index) + substring + string.substr(index);
}

Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};


Array.prototype.equals = function (array, strict) {
    if (!array)
        return false;

    if (arguments.length == 1)
        strict = true;

    if (this.length != array.length)
        return false;

    for (var i = 0; i < this.length; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i], strict))
                return false;
        }
        else if (strict && this[i] != array[i]) {
            return false;
        }
        else if (!strict) {
            return this.sort().equals(array.sort(), true);
        }
    }
    return true;
}


function findWithAttr(array, attr, value, isArray) {
    for (var i = 0; i < array.length; i += 1) {
        if (isArray && array[i][attr].equals(value) || array[i][attr] == value) {
            return i;
        }
    }
    return -1;
}


Highlight = {
    _highlightContainers: [],
    _colorClassMap: [],

    /**
     *
     * @param params
     * recebe um objeto do tipo:
     * {
     *       textContainerSelector: string,
     *       matches: [{match, matchExpression, tooltipText},...]

     */
    repositionAnchorsOnContainer: function (selector) {

    },
    highlight: function (params) {
        var selector = params.textContainerSelector;
        var matches = params.matches;
        var containerEl = $(selector);
        var regExpMatches = [];
        var id = params.id;
        var verbose = params.debug;
        //TODO talvez tenha que alterar a forma como a cor é criada. E como calculá-la?
        var containerHasHighlights = containerEl.hasClass('mab-hl-container');
        if (!containerHasHighlights) {
            if (verbose) {
                console.log("Creating new highlight...");
            }
            containerEl.addClass('mab-hl-container');
            containerEl.data('mabHlOriginalText', containerEl.html());
        } else {
            if (verbose) {
                console.log("Altering existing highlight...");
            }
        }
        var originalText = containerEl.data('mabHlOriginalText');
        var newText = originalText;
        var newCharCount = 0;


        if (id) {
            Highlight._highlightContainers.remove(id);
        } else {
            id = Highlight._highlightContainers.length;
        }

        var newHighlightObject = {
            id: id,
            selector: selector,
            matches: null,
            color: params.color ? params.color : 'rgb(114, 184, 255)',
        };

        for (var i = 0; i < matches.length; i++) {
            var m = matches[i];
            var pattern = new RegExp(m.match, 'g');
            var match;
            // now it's known where starts (index) what(match) and where it ends (index + match.length)
            while (match = pattern.exec(originalText)) {
                regExpMatches.push({
                    match: match[0],
                    highlight: newHighlightObject,
                    index: match.index,
                    replace: (m.tooltipText ? m.tooltipText : null),
                });
            }
        }

        newHighlightObject.matches = regExpMatches;
        Highlight._highlightContainers[id] = newHighlightObject;

        if (verbose) {
            console.warn("Container already has highlights; merging with previous matches to reposition anchors");
        }
        var highlightObjects = Highlight._highlightContainers.filter(function (obj) {
            return obj.selector == selector;
        });

        if (verbose) {

            console.warn("bug de match nas ÂNCORAS dependendo da expressão");
        }


        // now, if the same container already has highlights, I should merge these with them
        // so the new text highlights can be positioned
        var referencesPerCharIndex = {};
        for (var x = 0; x < highlightObjects.length; x++) {
            var highlightObj = highlightObjects[x];
            var matches = highlightObj.matches;
            for (var l = 0; l < matches.length; l++) {
                var matchObj = matches[l];
                var pos = matchObj.index;
                for (var y = 0; y < matchObj.match.length; y++) {
                    if (!referencesPerCharIndex.hasOwnProperty(pos)) {
                        referencesPerCharIndex[pos] = [];
                    }
                    referencesPerCharIndex[pos].push(matchObj);
                    pos += 1;
                }
            }
        }


        /*
         now the matches are grouped by VALUE, so, for example
         this
         1:a
         2:a
         3:a,b
         4:a,b
         5:b
         6:b
         becomes
         1,2:a
         3,4:a,b
         5,6:b
         */


        var newArray = [];

        Object.keys(referencesPerCharIndex).map(function (textIndex) {
            // first the key for the matches on a character of the text (index) is found or created
            var value = referencesPerCharIndex[textIndex];

            // since the indexes must be sequential, if the last value form the array has the same value
            // it means it will be part of the same highlight
            var id = newArray.length - 1;
            if (id == -1 || !newArray[id].matches.equals(value)) {
                id = newArray.push({
                        indexes: [],
                        matches: value
                    }) - 1;
            }
            // and then the index for the combination of matches is added
            newArray[id].indexes.push(parseInt(textIndex));
        });


        for (var i = 0; i < newArray.length; i++) {
            var map = newArray[i];
            var colorClassName = Highlight.getColorClass(map)


            var start = Math.min.apply(null, map.indexes);
            var end = Math.max.apply(null, map.indexes) + 1;


            var singleTooltip = '',
                tooltipAttr = '';


            map.matches.map(function (m) {
                if (tooltipAttr != '') {
                    tooltipAttr += '<br>-----------<br>';
                }
                if (m.replace != '') {
                    tooltipAttr += m.replace;
                }
            });
            if (tooltipAttr) {
                singleTooltip = " title='" + tooltipAttr + "' data-toggle='tooltip' ";
            }


            //console.log(i + ") " + (newText.substr(start + newCharCount, (end - start))));

            var newSpan = "<span tabindex='0' class='mab-hl-highlight " + colorClassName + "' " + singleTooltip + ">";
            //(r.replace ? "data-replace='" + r.replace + "'" : '') + ">";
            var newSpanClose = "</span>";
            newText = insertAt(newText, start + newCharCount, newSpan);
            newCharCount += newSpan.length;
            newText = insertAt(newText, end + newCharCount, newSpanClose);
            newCharCount += newSpanClose.length;
        }


        containerEl.html(newText);

        containerEl.find('[data-toggle="tooltip"]').tooltip({html: true});

        if (verbose) {
            console.log("Total matches: " + regExpMatches.length);
        }

        return id;
    },
    getColorClass: function (map) {
        var finalRGB = getColorFromName(map.matches[0].highlight.color);
        if (map.matches.length > 1) {
            for (var y = 1; y < map.matches.length; y++) {
                finalRGB = mid(finalRGB, getColorFromName(map.matches[y].highlight.color));
            }
        }
        var className = 'mab-hl-' + finalRGB.join('');
        var dottedClassName = '.' + className;
        if (Highlight._colorClassMap.indexOf(dottedClassName) === -1) {
            // adds to the HEAD the generated classes with hover events and stuff
            //var sheet = document.createStyleSheet();


            var css = document.createElement('style');
            css.type = 'text/css';

            var styles = dottedClassName + '{background-color: rgba(' + finalRGB.join(',') + ',0.6);}';
            styles += dottedClassName + ":hover," +
                dottedClassName + ":active," +
                dottedClassName + ':focus{background-color: rgba(' + finalRGB.join(',') + ',1);}';

            if (css.styleSheet) {
                css.styleSheet.cssText = styles;
            } else {
                css.appendChild(document.createTextNode(styles));
            }
            document.getElementsByTagName("head")[0].appendChild(css);

            Highlight._colorClassMap.push(dottedClassName);
        }

        return className;
    }
}

function getColorFromName(colorName) {
    var d = document.createElement("div");
    d.style.display = 'none';
    d.style.color = colorName;
    document.body.appendChild(d); //var color = window.getComputedStyle(d).color;
    var rgb = getColor(d, 'color');
    document.body.removeChild(d);
    return rgb;
}

function getColor(elem, prop) {
    var style = document.defaultView.getComputedStyle(elem, null);
    return style[prop]
        .replace(/^rgb\(([^\)]+)\)/, '$1')
        .replace(/\s/g, '')
        .split(',');
}

function mid(rgb1, rgb2) {
    var result = [],
        i = 0;
    for (; i < rgb1.length; i++) {
        result.push(Math.floor((parseInt(rgb1[i]) + parseInt(rgb2[i])) / 2));
    }
    return result;
}
function multiply(rgb1, rgb2) {
    var result = [],
        i = 0;
    for (; i < rgb1.length; i++) {
        result.push(Math.floor(rgb1[i] * rgb2[i] / 255));
    }
}
