Feature('cleaning-sessions');

Scenario('test something', ({ I }) => {
    I.amOnPage('/v1/cleaning-sessions');
    I.see("Request method 'GET' not supported",':root');
});
