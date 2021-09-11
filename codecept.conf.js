exports.config = {
  output: './src/test/javascript/sdet-assignment-service-codeceptsjs/output',
  helpers: {
    Playwright: {
      url: 'http://localhost:8080',
      show: false,
      browser: 'chromium'
    }
  },
  include: {
    I: './src/test/javascript/sdet-assignment-service-codeceptsjs/steps_file.js'
  },
  mocha: {},
  bootstrap: null,
  teardown: null,
  hooks: [],
  gherkin: {
    features: './src/test/javascript/sdet-assignment-service-codeceptsjs/features/*.feature',
    steps: ['./src/test/javascript/sdet-assignment-service-codeceptsjs/step_definitions/steps.js']
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
  tests: './src/test/javascript/sdet-assignment-service-codeceptsjs/*_test.js',
  name: 'sdet-assignment-service-codeceptsjs'
}