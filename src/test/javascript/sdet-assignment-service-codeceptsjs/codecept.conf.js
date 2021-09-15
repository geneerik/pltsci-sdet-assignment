require("ts-node/register");
const { setHeadlessWhen } = require("@codeceptjs/configure");
const { bootstrap, bootstrapAll, teardown, teardownAll } = require("./presettings");

// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
setHeadlessWhen(process.env.HEADLESS);

// TODO: need to change url to an env variable
exports.config = {
    output: "./test_output/output",
    helpers: {
        Playwright: {
            url: "http://localhost:8080",
            show: false,
            browser: "chromium"
        },
        REST: {
            endpoint: "http://localhost:8080"
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