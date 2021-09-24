"use strict";
/**
 * Module to hold the custom exceptions for the SDET assignment.
 *
 * @module sdet-assignment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = void 0;
/**
 * Exception class indicating that an (asynchronous) operation has timed out
 *
 * @extends Error
 */
class TimeoutError extends Error {
}
exports.TimeoutError = TimeoutError;
