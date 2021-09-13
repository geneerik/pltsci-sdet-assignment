Feature('cleaning-sessions (UI)');

Scenario('check if service is running', ({ I }) => {
    I.amOnPage('/v1/cleaning-sessions');
    I.see("Request method 'GET' not supported",':root');
});
