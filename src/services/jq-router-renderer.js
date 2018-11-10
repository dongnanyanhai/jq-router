/*!
 * jQ-Router JQuery Plugin v4.0.0
 * https://github.com/muzammilkm/jq-router
 *
 * Copyright 2017, Muzammil Khaja Mohammed
 * Licensed under the MIT license.
 * https://github.com/muzammilkm/jq-router/blob/master/LICENSE
 *
 * Date: Tue Nov 10 6:00:00 2018 +0530
 */

(function($, router) {

    router.renderEngine = (function() {
        var s = {},
            templateCache = {},
            viewSelector;

        /**
         * Raise view destroy event before rendering the view.
         * @param {string} url
         * @return {object} renderEngine
         */
        s.clean = function(segments, till) {
            var s = this;
            for (var i = segments.length - 1; i >= till; i--) {
                var _route = router.getRouteName(segments[i]);
                $(window).trigger(router.events.viewDestroyed, [_route]);
            }
            return s;
        };

        /**
         * Download the template from server via ajax call.
         * @param {string} url
         * @return {object} deferred
         */
        s.getViewTemplate = function(url) {
            return $.get({
                    url: url,
                    dataType: 'html'
                })
                .then(function(content) {
                    templateCache[url] = content;
                });
        };

        /**
         * Check route template available in template cache or download the template.
         * @param {object} route
         * @return {object} deferred
         */
        s.processRoute = function(route, params) {
            var s = this,
                requests = [];

            for (var i = 0; i < route.segments.length; i++) {
                var _route = router.getRouteName(route.segments[i]);
                if (Array.isArray(_route.resolve)) {
                    for (var j = 0; j < _route.resolve.length; j++) {
                        var cb = _route.resolve[j];
                        if (typeof(cb) === "function") {
                            requests.push(cb(route, params));
                        }
                    }
                } else if (typeof(_route.resolve) === "function") {
                    requests.push(_route.resolve(route, params));
                }

                if (!templateCache[_route.templateUrl]) {
                    requests.push(s.getViewTemplate(_route.templateUrl));
                }
            }

            return $.when.apply($, requests);
        };

        /**
         * Render changed route from template cache & notify successfully rendered view.
         * @param {object} route
         * @param {object} params
         * @return {object} this
         */
        s.render = function(route, params) {
            var currentRoute = router.getCurrentRoute(),
                reload = $.isEmptyObject(currentRoute);

            for (var i = 0; i < route.segments.length; i++) {
                var _route = router.getRouteName(route.segments[i]),
                    $page = $(viewSelector + ':eq(' + i + ')');

                if (!reload) {
                    reload = (route.segments[i] !== currentRoute.segments[i]) ||
                        (router.isRouteParamChanged(route.segments[i], params));
                    if (reload) {
                        s.clean(currentRoute.segments, i);
                    }
                }


                if (reload) {
                    $page.html(templateCache[_route.templateUrl]);
                    $(window).trigger(router.events.renderViewSuccess, [_route, route, params]);
                }
            }
            return this;
        };

        /**
         * Set view selector for render engine to be used.
         * @param {string} selector
         * @return {object} this
         */
        s.setViewSelector = function(selector) {
            viewSelector = selector;
            return this;
        };

        return s;
    }());
    
}(jQuery, $.router));
