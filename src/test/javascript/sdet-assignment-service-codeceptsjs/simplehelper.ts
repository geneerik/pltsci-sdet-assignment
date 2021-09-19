/** 
 * Helper class to empower step discovery where is might be missing and add access to some of the
 * runner features not directly exposed by CodeceptJS
 */
export = class SimpleHelper extends Helper {
    
    /**
     * Method to allow a call chain via the I mechanism which would not otheriwse be recognized as
     * a step by CodeceptJS
     * 
     * @param  {()=>void} action The function to be wrapped in the in the helper method call
     * @returns any
     */
    performSimpleAction(action:()=>unknown): unknown {
        return action();
    }

    /**
     * @property {()=>void} afterSuiteAction Value fo the user-defined action to be executed after
     *                                       the end of the test suite.
     */
    protected afterSuiteAction:()=>void|undefined;
    
    /**
     * Method to set the value of the user-defined action to be executed after the end of the test
     * suite.  The afterSuite mocha runner is not definable by a test suite in some cases, such as
     * when using BDD and so is made available via this mechanism
     * 
     * @param  {()=>void} action
     */
    setAfterSuite(action:()=>void): void {
        this.afterSuiteAction = action;
    }

    /**
     * Hook executed after each suite
     * 
     * @param  {Mocha.Suite} suite The Mocha suite for which the _afterSuite method is being called
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _afterSuite(suite: Mocha.Suite): void {
        if (undefined !== this.afterSuiteAction){
            this.afterSuiteAction();
        }
    }
}
