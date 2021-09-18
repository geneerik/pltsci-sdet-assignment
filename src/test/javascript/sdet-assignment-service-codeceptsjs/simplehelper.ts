export = class SimpleHelper extends Helper {
    performSimpleAction(action:()=>void): any {
        return action();
    }
    afterSuiteAction:()=>void|undefined;
    setAfterSuite(action:()=>void): any {
        this.afterSuiteAction = action;
    }
    _afterSuite(suite: Mocha.Suite){
        if (undefined !== this.afterSuiteAction){
            this.afterSuiteAction();
        }
    }
}
