/**
 * Created by bxo on 31/01/2017.
 */

function insertAt(string, index, substring) {
    return string.substr(0, index) + substring + string.substr(index);
}

Highlight = {
    recalculate: function () {
        console.log("Highlight - recalculate started");
        var start = new Date();

        for (var textSelector in Highlight._highlightContainers) {
            if (Highlight._highlightContainers.hasOwnProperty(textSelector)) {
                Highlight.appendHighlights(textSelector);
            }
        }
        var end = new Date();
        console.log("Highlight - recalculation completed after " + (end - start) / 1000 + " seconds");
    },
    appendHighlights: function (textSelector) {
        var originalTextEl = $(textSelector);
        var anchors = originalTextEl.find(".mab-hl-text-anchor");
        var generalContainer = $(originalTextEl).closest('.mab-hl-container');
        var highlightsContainer = generalContainer.find(".mab-hl-highlights-container");
        highlightsContainer.html("");

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
                "data-toggle='tooltip' " +
                "title='" + this.dataset.replace + "' " +
                "class='mab-hl-text-highlight' " +
                "style='top: " + (this.offsetTop - originalTextOffsetTop) + "px; margin-left: " + (this.offsetLeft - originalTextOffsetLeft) + "px;'>" +
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
    highlight: function (params) {
        var container = params.textContainerSelector;
        var matches = params.matches;
        var containerEl = $(container);
        var regExpMatches = [];
        var texto = containerEl.html();
        containerEl.addClass('mab-hl-text-container');
        containerEl.wrap("<div class='mab-hl-container'></div>");
        containerEl.after("<div class='mab-hl-highlights-container'></div>");


        console.warn("bug de match nas ÂNCORAS dependendo da expressão");
        console.warn("isso assume que o texto É IMUTÁVEL, visto que as posições são gravadas somente 1x");
        for (var i=0;i<matches.length;i++) {
            var m = matches[i];

            //var objMatch = matches[i];
            //var pattern = new RegExp('\\b' + objMatch.match + '\\b', 'g');
            //before:
            var pattern = new RegExp(m.match, 'g');
            var match;

            while (match = pattern.exec(texto)) {
                regExpMatches.push({
                    match: match[0],
                    index: match.index,
                    replace: m.tooltipText
                });
            }
        }


        regExpMatches.sort(function (a, b) {
            return a.index - b.index;
        });
        var newCharCount = 0;
        var newText = texto;
        for (var i = 0; i < regExpMatches.length; i++) {
            var r = regExpMatches[i];
            var newSpan = "<span class='mab-hl-text-anchor' " +
                "data-match='" + r.match + "' " +
                "data-replace='" + r.replace + "'></span>";
            newText = insertAt(newText, r.index + newCharCount, newSpan);
            newCharCount += newSpan.length;
        }

        containerEl.html(newText);

        console.log("Total matches: " + regExpMatches.length);
        console.log(regExpMatches);
        // lembrar de ordenar por posição pra facilitar a vida


        Highlight._highlightContainers[container] = regExpMatches;

        Highlight.recalculate();
    },
    _highlightContainers: {}


}


