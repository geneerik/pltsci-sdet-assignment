/**
 * Module to hold the custom classes for the SDET assignment.
 *
 * @module sdet-assignment.exceptions
 */

/**
 * Exception class indicating that an (asynchronous) operation has timed out
 * 
 * @extends Error
 */
class TimeoutError extends Error {}

export {TimeoutError};