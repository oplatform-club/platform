define(function(require) {
    'use strict';
    var $ = require('jquery');
    var _ = require('underscore');
    var layout = require('oroui/js/layout');
    var tools = require('oroui/js/tools');

    return {
        /**
         * Returns visible rect of DOM element
         *
         * @param el
         * @param {{top: number, left: Number, bottom: Number, right: Number}} increments for each initial rect side
         * @param {boolean} forceInvisible if true - function will return initial rect when element is out of screen
         * @param {Function} onAfterGetClientRect - callback called after each getBoundingClientRect
         * @returns {{top: number, left: Number, bottom: Number, right: Number}}
         */
        getVisibleRect: function(el, increments, forceInvisible, onAfterGetClientRect) {
            increments = increments || {};
            _.defaults(increments, {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            });
            var current = el;
            var midRect = this.getEditableClientRect(current);
            if (onAfterGetClientRect) {
                onAfterGetClientRect(current, midRect);
            }
            var borders;
            var resultRect = {
                top: midRect.top + increments.top,
                left: midRect.left + increments.left,
                bottom: midRect.bottom + increments.bottom,
                right: midRect.right + increments.right
            };
            if (
                (resultRect.top === 0 && resultRect.bottom === 0) || // no-data block is shown
                    (resultRect.top > $(document).height() && forceInvisible) // grid is invisible
                ) {
                // no need to calculate anything
                return resultRect;
            }
            current = current.parentNode;
            while (current && current.getBoundingClientRect) {
                midRect = this.getEditableClientRect(current);
                if (onAfterGetClientRect) {
                    onAfterGetClientRect(current, midRect);
                }

                borders = $.fn.getBorders(current);

                if (tools.isMobile()) {
                    /**
                     * Equals header height. Cannot calculate dynamically due to issues on ipad
                     */
                    if (resultRect.top < layout.MOBILE_HEADER_HEIGHT && current.id === 'top-page' &&
                        !$(document.body).hasClass('input-focused')) {
                        resultRect.top = layout.MOBILE_HEADER_HEIGHT;
                    } else if (resultRect.top < layout.MOBILE_POPUP_HEADER_HEIGHT &&
                        current.className === 'widget-content') {
                        resultRect.top = layout.MOBILE_POPUP_HEADER_HEIGHT;
                    }
                }

                if (resultRect.top < midRect.top + borders.top) {
                    resultRect.top = midRect.top + borders.top;
                }
                if (resultRect.bottom > midRect.bottom - borders.bottom) {
                    resultRect.bottom = midRect.bottom - borders.bottom;
                }
                if (resultRect.left < midRect.left + borders.left) {
                    resultRect.left = midRect.left + borders.left;
                }
                if (resultRect.right > midRect.right - borders.right) {
                    resultRect.right = midRect.right - borders.right;
                }
                current = current.parentNode;
            }

            if (resultRect.top < 0) {
                resultRect.top = 0;
            }

            return resultRect;
        },

        getEditableClientRect: function(el) {
            var rect = el.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right
            };
        },

        isCompletelyVisible: function(el, onAfterGetClientRect) {
            var rect = this.getEditableClientRect(el);
            if (onAfterGetClientRect) {
                onAfterGetClientRect(el, rect);
            }
            if (rect.top === rect.bottom || rect.left === rect.right) {
                return false;
            }
            var visibleRect = this.getVisibleRect(el, null, true, onAfterGetClientRect);
            return visibleRect.top === rect.top &&
                visibleRect.bottom === rect.bottom &&
                visibleRect.left === rect.left &&
                visibleRect.right === rect.right;
        },

        scrollIntoView: function(el, onAfterGetClientRect) {
            if (this.isCompletelyVisible(el, onAfterGetClientRect)) {
                return;
            }

            var rect = this.getEditableClientRect(el);
            if (onAfterGetClientRect) {
                onAfterGetClientRect(el, rect);
            }
            if (rect.top === rect.bottom || rect.left === rect.right) {
                return false;
            }
            var visibleRect = this.getVisibleRect(el, null, true, onAfterGetClientRect);
            var scrolls = {
                vertical: rect.top !== visibleRect.top ? visibleRect.top - rect.top :
                    (rect.bottom !== visibleRect.bottom ? visibleRect.bottom - rect.bottom : 0),
                horizontal: rect.left !== visibleRect.left ? visibleRect.left - rect.left :
                    (rect.right !== visibleRect.right ? visibleRect.right - rect.right : 0)
            };

            this.applyScrollToParents(el, scrolls);
        },

        applyScrollToParents: function(el, scrolls) {
            if (!scrolls.horizontal && !scrolls.vertical) {
                return;
            }
            // make a local copy to don't change initial object
            scrolls = _.extend({}, scrolls);

            $(el).parents().each(function() {
                var $this = $(this);
                if (scrolls.horizontal !== 0) {
                    switch ($this.css('overflowX')) {
                        case 'auto':
                        case 'scroll':
                            if (this.clientWidth < this.scrollWidth) {
                                var oldScrollLeft = this.scrollLeft;
                                this.scrollLeft = this.scrollLeft - scrolls.vertical;
                                scrolls.vertical += this.scrollLeft - oldScrollLeft;
                            }
                            break;
                        default:
                            break;
                    }
                }
                if (scrolls.vertical !== 0) {
                    switch ($this.css('overflowY')) {
                        case 'auto':
                        case 'scroll':
                            if (this.clientHeight < this.scrollHeight) {
                                var oldScrollTop = this.scrollTop;
                                this.scrollTop = this.scrollTop - scrolls.vertical;
                                scrolls.vertical += this.scrollTop - oldScrollTop;
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
        }
    };
});
