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
                "class='mab-hl-text-highlight' " +
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
        var color = params.color ? params.color : 'rgb(114, 184, 255)';
        var newCharCount = 0;
        var containerHasHighlights = containerEl.hasClass('mab-hl-text-container');

        if (id){
            Highlight._highlightContainers.remove(id);
        }

        if (!containerHasHighlights) {
            console.log("Creating new highlight...");
            containerEl.addClass('mab-hl-text-container');
            containerEl.wrap("<div class='mab-hl-container'></div>");
            containerEl.after("<div class='mab-hl-highlights-container'></div>");
            containerEl.data('mabHlOriginalText', containerEl.html());
        } else {
            console.log("Altering existing highlight...");
        }
        var originalText = containerEl.data('mabHlOriginalText');
        var newText = originalText;


        console.warn("bug de match nas ÂNCORAS dependendo da expressão");
        console.warn("isso assume que o texto É IMUTÁVEL, visto que as posições são gravadas somente 1x");

        for (var i = 0; i < matches.length; i++) {
            var m = matches[i];

            //var objMatch = matches[i];
            //var pattern = new RegExp('\\b' + objMatch.match + '\\b', 'g');
            //before:
            var pattern = new RegExp(m.match, 'g');
            var match;

            while (match = pattern.exec(originalText)) {
                regExpMatches.push({
                    match: match[0],
                    index: match.index,
                    replace: (m.tooltipText ? m.tooltipText : null),
                });
            }
        }


        if (!id) { // if not mentioned, generates new id
            id = Highlight._highlightContainers.length;
        }

        var regExpMatchesToAnchor = regExpMatches;
        for (var x = 0; x < regExpMatchesToAnchor.length; x++) {
            regExpMatchesToAnchor[x].id = id;
        }


        if (containerHasHighlights) {
            console.warn("Container already has highlights; merging with previous matches to reposition anchors");
            var sharedObjects = Highlight._highlightContainers.filter(function (obj) {
                return obj.selector == selector;
            })

            if (sharedObjects) {
                for (var idx = 0; idx < sharedObjects.length; idx++) {
                    var obj = sharedObjects[idx];
                    var otherMatches = obj.matches;
                    var otherId = obj.id;
                    for (var x = 0; x < otherMatches.length; x++) {
                        otherMatches[x].id = otherId;
                    }
                    regExpMatchesToAnchor = regExpMatches.concat(otherMatches);
                }
            }
            //must reposition anchors from other highlight objects

        }

        regExpMatchesToAnchor.sort(function (a, b) {
            return a.index - b.index;
        });


        for (var i = 0; i < regExpMatchesToAnchor.length; i++) {
            var r = regExpMatchesToAnchor[i];
            var newSpan = "<span class='mab-hl-text-anchor' " +
                "data-id-highlight='" + r.id + "' " +
                "data-match='" + r.match + "' " +
                (r.replace?"data-replace='" + r.replace:'') + "'></span>";
            newText = insertAt(newText, r.index + newCharCount, newSpan);
            newCharCount += newSpan.length;
        }

        containerEl.html(newText);

        console.log("Total matches: " + regExpMatches.length);
        console.log(regExpMatches);


        Highlight._highlightContainers.push({
            id: id,
            selector: selector,
            matches: regExpMatches,
            color: color,
        });

        Highlight.recalculate();
        return id;
    },
}

