/**
 * Created by bxo on 31/01/2017.
 */

function insertAt(string, index, substring) {
    return string.substr(0, index) + substring + string.substr(index);
}

Highlight = {
    recalculate: function () {
        console.log("Recalculando highlights...");
        for (var textSelector in Highlight._highlightContainers) {
            if (Highlight._highlightContainers.hasOwnProperty(textSelector)) {
                var originalTextEl = $(textSelector);
                var highlights = Highlight._highlightContainers[textSelector];
                var highlightContainer = $(originalTextEl).closest('.mab-hl-container');
                var highlightsContainer = highlightContainer.find(".mab-hl-highlights-container");
                highlightsContainer.html("");

                var originalTextPaddingTop = parseInt(originalTextEl.css("padding-top"));
                var originalTextMarginTop = parseInt(originalTextEl.css("margin-top"));
                var originalTextBorderTop = parseInt(originalTextEl.css("border-top"));

                var originalTextPaddingLeft = parseInt(originalTextEl.css("padding-left"));
                var originalTextMarginLeft = parseInt(originalTextEl.css("margin-left"));
                var originalTextBorderLeft = parseInt(originalTextEl.css("border-left"));
                //todo testar se é NaN
                var originalTextOffsetTop = originalTextBorderTop + originalTextMarginTop + originalTextPaddingTop;
                var originalTextOffsetLeft = originalTextBorderLeft + originalTextMarginLeft + originalTextPaddingLeft;

                var newBaseHighlightContainer = originalTextEl.clone();
                newBaseHighlightContainer.html("");
                newBaseHighlightContainer
                    .removeAttr("id")
                    .removeClass("mab-hl-text-container")
                    .addClass('mab-hl-highlight-container')


                var newAnchorHtml = "<span class='mab-hl-text-anchor'></span>";

                for (var i = 0; i < highlights.length; i++) {
                    var hl = highlights[i];
                    var newHtml = insertAt(originalTextEl.html(), hl.index, newAnchorHtml);
                    originalTextEl.html(newHtml);
                    var anchorEl = highlightContainer.find(".mab-hl-text-anchor");

                    var span = $("<span tabindex='0'" +
                        "data-toggle='tooltip' " +
                        "title='" + hl.replace + "' " +
                        "class='mab-hl-text-highlight' " +
                        "style='top: " + (anchorEl[0].offsetTop - originalTextOffsetTop) + "px; margin-left: " + (anchorEl[0].offsetLeft - originalTextOffsetLeft) + "px;'>" +
                        hl.match +
                        "</span>");
                    var el = newBaseHighlightContainer
                        .clone()
                        .append(span);
                    highlightsContainer.append(el);
                    anchorEl.detach();
                }

                highlightContainer.find('[data-toggle="tooltip"]').tooltip({html: true});
            }
        }
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
        containerEl.addClass('mab-hl-text-container');
        containerEl.wrap("<div class='mab-hl-container'></div>");
        containerEl.after("<div class='mab-hl-highlights-container'></div>");

        console.warn("bug de match nas ÂNCORAS dependendo da expressão");
        console.warn("isso assume que o texto É IMUTÁVEL, visto que as posições são gravadas somente 1x");
        var regExpMatches = [];
        var texto = containerEl.html();
        for (var i = 0; i < matches.length; i++) {
            var objMatch = matches[i];
            var pattern = new RegExp(objMatch.matchExpression, 'g');
            var match;
            // acho que o jeito vai ser montar a string aos poucos...
            // ou melhor, gravo a POSIÇÃO onde devo colocar algo
            // e vou calculando a partir daí pra montar a string
            /*var replace = "<span class='mab-hl-text-anchor' " +
             "data-texto='" + objMatch.match + "' " +
             "data-tooltip-text='" + objMatch.tooltipText + "'></span>" + objMatch.match;*/
            while (match = pattern.exec(texto)) {
                regExpMatches.push({
                    match: match[0],
                    index: match.index,
                    replace: objMatch.tooltipText
                });
            }
        }

        Highlight._highlightContainers[container] = regExpMatches;

        Highlight.recalculate();
    }
    ,
    _highlightContainers: {}


}


