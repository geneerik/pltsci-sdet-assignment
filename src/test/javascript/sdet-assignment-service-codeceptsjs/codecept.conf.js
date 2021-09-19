/* eslint-disable @typescript-eslint/no-var-requires */
require("ts-node/register");
const { setHeadlessWhen } = require("@codeceptjs/configure");
const { bootstrap, bootstrapAll, teardown, teardownAll } = require("./presettings");
const target_base_uri =
    process.env.TARGET_BASE_URI?process.env.TARGET_BASE_URI:"http://localhost:8080";

// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
setHeadlessWhen(process.env.HEADLESS);

exports.config = {
    output: "./test_output/output",
    report_output: "./test_output/report",
    allure_issue_tracker_pattern:
        "https://github.com/geneerik/pltsci-sdet-assignment-unittests/issue/%s",
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
    hooks: [],
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
            enabled: true
        },
        tryTo: {
            enabled: true
        },
        allure: {}
    },
    tests: "./*_test.ts",
    name: "codeceptjs"
};