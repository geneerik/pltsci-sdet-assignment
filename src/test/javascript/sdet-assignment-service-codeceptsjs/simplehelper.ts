export = class SimpleHelper extends Helper {
    performSimpleAction(action:()=>void): any {
        return action();
    }
    setAfterSuite(action:()=>void): any {
        this._afterSuite = action;
    }
}
