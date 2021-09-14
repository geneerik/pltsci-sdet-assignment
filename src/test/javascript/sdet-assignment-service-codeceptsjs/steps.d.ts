/// <reference types='codeceptjs' />
type steps_file = typeof import('./steps_file');
type SimpleHelper = import('./simplehelper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any }
  interface Methods extends Playwright, REST, SimpleHelper {}
  interface I extends ReturnType<steps_file>, WithTranslation<SimpleHelper> {}
  namespace Translation {
    interface Actions {}
  }
}
