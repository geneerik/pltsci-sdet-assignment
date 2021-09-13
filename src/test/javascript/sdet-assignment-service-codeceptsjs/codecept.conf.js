require("ts-node/register");
const { setHeadlessWhen } = require("@codeceptjs/configure");
const { bootstrap } = require("./presettings.ts");

// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
setHeadlessWhen(process.env.HEADLESS);

exports.config = {
    output: "./output",
    helpers: {
        Playwright: {
            url: "http://localhost:8080",
            show: false,
            browser: "chromium"
        },
        REST: {
            endpoint: "http://localhost:8080"
        },
    },
    include: {
        I: "./steps_file.ts"
    },
    mocha: {},
    bootstrap,
    teardown: null,
    hooks: [],
    gherkin: {
        features: "./features/*.feature",
        steps: ["./step_definitions/steps.js"]
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
        }
    },
    tests: "./*_test.ts",
    name: "codeptjs"
};