/**
 * @module steps_file
 */

/**
 * Method to add methods and properties to the Actor (I)
 * 
 * @param  {any} ...args
 * @returns any
 */
// To keep type-hinting working well, the return type of this function need to remain un-typed
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars
function getCustomActorold (...args: any) {
    return actor({
        /**
         * Note: whenever possible, move contents to a helper for better documentation and more
         * consistent hinting
         */
    });
}

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-unused-vars
function getCustomActor(...args: any): CodeceptJS.WithTranslation<CodeceptJS.Methods & {
    // Any method or property signatures would be added here
}> {
    return actor({
        
        /**
         * Note: whenever possible, move contents to a helper for better documentation and more
         * consistent hinting
         */

    });
}

export = getCustomActor;