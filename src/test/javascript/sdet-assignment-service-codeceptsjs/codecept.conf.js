/* eslint-disable @typescript-eslint/no-var-requires */
require("ts-node/register");
const { format: stringFormat } = require("util");
const { setHeadlessWhen } = require("@codeceptjs/configure");
const { bootstrap, bootstrapAll, teardown, teardownAll, customHook } = require("./presettings");
const target_base_uri = stringFormat(
    process.env.TARGET_BASE_URI?process.env.TARGET_BASE_URI:"http://localhost:%s","8080");

// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
setHeadlessWhen(process.env.HEADLESS);

exports.config = {
    output: "./test_output/output",
    // TODO: this should be the allure outputHtmlDir variable instead?
    report_output: "./test_output/report",
    // TODO: make this part of the allure plugin settings (if it makes a html report)
    allure_issue_tracker_pattern:
        "https://github.com/geneerik/pltsci-sdet-assignment/issues/%s",
    helpers: {
        Playwright: {
            url: target_base_uri,
            show: false,
            browser: "chromium"
        },
        REST: {
            endpoint: target_base_uri
        },
        SimpleHelper: {
            require: "./simplehelper"
        }
    },
    include: {
        I: "./steps_file.ts"
    },
    mocha: {},
    bootstrap: bootstrap,
    bootstrapAll: bootstrapAll,
    teardown: teardown,
    teardownAll: teardownAll,
    hooks: [
        customHook
    ],
    gherkin: {
        features: "./features/*.feature",
        steps: ["./step_definitions/steps.ts"]
    },
    plugins: {
        screenshotOnFail: {
            enabled: true
        },
        pauseOnFail: {},
        retryFailedStep: {
            enabled: false
        },
        tryTo: {
            enabled: true
        },
        allure: {
            targetDir: "./test_output/report"
        },
        simplePlugin: {
            require: "./simpleplugin",
            enabled: true
        }
    },
    tests: "./*_test.ts",
    name: "codeceptjs"
};