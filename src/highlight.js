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
    clearHighlightContainers: function () {
        console.warn("Cleaning containers...");
        $(".mab-hl-highlights-container").html("");
    },
    recalculate: function () {
        console.log("Highlight - recalculate started");
        var start = new Date();

        Highlight.clearHighlightContainers();

        for (var index = 0; index < Highlight._highlightContainers.length; index++) {
            Highlight.appendHighlights(index);
        }
        var end = new Date();
        console.log("Highlight - recalculation completed after " + (end - start) / 1000 + " seconds");
    },
    appendHighlights: function (index) {
        var obj = Highlight._highlightContainers[index];
        var id = obj.id;
        var textSelector = obj.selector;
        var color = obj.color;
        var originalTextEl = $(textSelector);
        var anchors = originalTextEl.find(".mab-hl-text-anchor[data-id-highlight='" + id + "']");
        var generalContainer = $(originalTextEl).closest('.mab-hl-container');
        var highlightsContainer = generalContainer.find(".mab-hl-highlights-container");

        console.warn("Recalc for id " + id);

        var originalTextPaddingTop = parseInt(originalTextEl.css("padding-top"));
        var originalTextMarginTop = parseInt(originalTextEl.css("margin-top"));
        var originalTextBorderTop = parseInt(originalTextEl.css("border-top"));

        var originalTextPaddingLeft = parseInt(originalTextEl.css("padding-left"));
        var originalTextMarginLeft = parseInt(originalTextEl.css("margin-left"));
        var originalTextBorderLeft = parseInt(originalTextEl.css("border-left"));
        //todo check if not NaN
        var originalTextOffsetTop = originalTextBorderTop + originalTextMarginTop + originalTextPaddingTop;
        var originalTextOffsetLeft = originalTextBorderLeft + originalTextMarginLeft + originalTextPaddingLeft;

        var newBaseHighlightContainer = originalTextEl.clone();
        newBaseHighlightContainer.html("");
        newBaseHighlightContainer
            .removeAttr("id")
            .removeClass("mab-hl-text-container")
            .addClass('mab-hl-highlight-container');
        anchors.each(function () {

            var span = $("<span tabindex='0'" +
                (this.dataset.replace ? "data-toggle='tooltip' " : " ") +
                "title='" + this.dataset.replace + "' " +
                "class='mab-hl-highlight-wrapper' " +
                "style='background-color: " + color + "; top: " + (this.offsetTop - originalTextOffsetTop) + "px; margin-left: " + (this.offsetLeft - originalTextOffsetLeft) + "px;'>" +
                this.dataset.match +
                "</span>");
            var el = newBaseHighlightContainer
                .clone()
                .append(span);
            highlightsContainer.append(el);

        });

        generalContainer.find('[data-toggle="tooltip"]').tooltip({html: true});

    },

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
        //TODO talvez tenha que alterar a forma como a cor é criada. E como calculá-la?
        var containerHasHighlights = containerEl.hasClass('mab-hl-container');
        if (!containerHasHighlights) {
            console.log("Creating new highlight...");
            containerEl.addClass('mab-hl-container');
            containerEl.data('mabHlOriginalText', containerEl.html());
        } else {
            console.log("Altering existing highlight...");
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


        console.warn("Container already has highlights; merging with previous matches to reposition anchors");
        var highlightObjects = Highlight._highlightContainers.filter(function (obj) {
            return obj.selector == selector;
        });

        console.warn("bug de match nas ÂNCORAS dependendo da expressão");


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


        var arrNovo = [];

        Object.keys(referencesPerCharIndex).map(function (textIndex) {
            // first the key for the matches on a character of the text (index) is found or created
            var value = referencesPerCharIndex[textIndex];

            var id = findWithAttr(arrNovo, 'matches', value, true);
            if (id == -1) {
                id = arrNovo.push({
                        indexes: [],
                        matches: value
                    }) - 1;
            }
            // and then the index for the combination of matches is added
            arrNovo[id].indexes.push(parseInt(textIndex));
        });

        /*highlightObjects.sort(function (a, b) {
         return a.index - b.index;
         });*/
        for (var i = 0; i < arrNovo.length; i++) {
            var a = arrNovo[i];
            var finalRGB = getColorFromName(matches[0].highlight.color);
            if (a.matches.length > 1) {
                for (var y = 1; y < a.matches.length; y++) {
                    finalRGB = mid(finalRGB, getColorFromName(a.matches[y].highlight.color));
                }
            }
            var finalColor = 'rgb(' + finalRGB.join(',') + ')';

            var start = Math.min.apply(null, a.indexes);
            var end = Math.max.apply(null, a.indexes) + 1;


            var singleTooltip = '';
            if (a.matches.length == 1) {
                singleTooltip = " title='" + a.matches[0].replace + "' data-toggle='tooltip' ";
            }

            var newSpan = "<span tabindex='0' class='mab-hl-highlight-wrapper' " + singleTooltip + "><span class='mab-hl-highlight'  style='background-color: " + finalColor + "'></span>";
            //(r.replace ? "data-replace='" + r.replace + "'" : '') + ">";
            var newSpanClose = "</span>";
            newText = insertAt(newText, start + newCharCount, newSpan);
            newCharCount += newSpan.length;
            newText = insertAt(newText, end + newCharCount, newSpanClose);
            newCharCount += newSpanClose.length;
        }


        containerEl.html(newText);

        containerEl.find('[data-toggle="tooltip"]').tooltip({html: true});

        console.log("Total matches: " + regExpMatches.length);

        return id;
    },


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


