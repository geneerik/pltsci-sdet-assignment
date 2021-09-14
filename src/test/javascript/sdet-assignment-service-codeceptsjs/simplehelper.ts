export = class SimpleHelper extends Helper {
    performSimpleAction(action:()=>void): any {
        return action();
    }
}
