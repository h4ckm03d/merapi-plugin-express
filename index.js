"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const router = require("./lib/router");
const getfn = require("./lib/getfn");

module.exports = function(merapi) {

    return {
        apps: [],

        typeExpress(name, opt) {
            this.apps.push(name);
            return function*(config, injector, logger) {
                let app = express();

                let getFn = getfn(injector);

                app.use(bodyParser.json());

                opt.middleware = opt.middleware || "middleware";
                let middleware = config.default(opt.middleware, []);
                for (let i=0; i<middleware.length; i++) {
                    app.use(yield getFn(middleware[i]));
                }

                opt.routes = opt.routes || "routes";
                let routes = config.default(opt.routes, {});
                app.use(yield router(injector, routes));

                opt.config = opt.config || "app";
                let cfg = config.default(opt.config, {host:"localhost", port:8080});
                app.start = function() {
                    app.listen(cfg.port, cfg.host);
                    logger.info(`Starting express on ${cfg.host}:${cfg.port}`);
                };
                return app;
            };
        },

        *onStart() {
            for (let i=0; i<this.apps.length; i++) {
                let app = yield merapi.resolve(this.apps[i]);
                app.start();
            }
        }
    };
};