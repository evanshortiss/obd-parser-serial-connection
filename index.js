'use strict';

var serialport = require('serialport')
  , Promise = require('bluebird')
  , VError = require('verror')
  , conn = null
  , assert = require('assert')
  , debug = require('debug')(require('./package.json').name);


// Keep track of connection requests
var connQ = [];

/**
 * Factory function that can be used to get connections.
 *
 * It's not possible to have more than one connection so this will ensure
 * that all callers share the same connection.
 *
 * @param  {Object}   opts
 * @return {Promise | Socket}
 */
module.exports = function (opts) {

  assert.equal(
    typeof opts,
    'object',
    'an options object must be provided to obd-serial-connection'
  );

  assert.equal(
    typeof opts.serialPath,
    'string',
    'opts.serialPath should be a string provided to obd-serial-connection'
  );

  assert.equal(
    typeof opts.serialOpts,
    'object',
    'opts.serialOpts should be an Object provided to obd-serial-connection'
  );

  return function _obdSerialConnectorFn (configureFn) {
    assert.equal(
      typeof configureFn,
      'function',
      'you must provide a configureFn that returns a promise'
    );

    return new Promise(function (resolve, reject) {
      debug('creating serialport connection');

      if (conn && conn.ready) {
        debug('returning existing connection instance');
        resolve(conn);
      } else {
        debug('opening a serial connection');

        // Keep track of the promise(s) we're returning
        connQ.push({
          resolve: resolve,
          reject: reject
        });

        // Create our connection
        conn = new serialport.SerialPort(opts.serialPath, opts.serialOpts);

        // Connect to the serial port
        conn.on('open', function () {
          onConnectionOpened(configureFn);
        });

        conn.on('error', function (err) {
          onConnectionOpened(configureFn, err);
        });
      }
    });
  };
};

/**
 * Parses serial data and emits and event related to the PID of the data.
 * Pollers will listen for events related to their PID
 * @param {String} str
 */
function onSerialData (str) {
  debug('received obd data %s', str);
}


/**
 * Resolves/rejects any pending connection requests, depending on Error passed
 * @param  {Error} err
 */
function respondToConnectionRequests (err) {
  connQ.forEach(function (req) {
    if (err) {
      req.reject(err);
    } else {
      req.resolve(conn);
    }
  });
}


/**
 * General callback for the "error" event on the connection to ensure
 * all errors are cpatured and logged.
 * @param  {Erorr} err
 */
function onSerialError (err) {
  debug('serial emitted an error %s', err.toString());
  debug(err.stack);
}


/**
 * Handler for the "open" event for connections.
 *
 * This performs error handling if the connection fails, or sets up the
 * connection with useful defaults if the connection is successful.
 *
 * @param  {Error} err
 */
function onConnectionOpened (configureFn, err) {
  if (err) {
    err = new VError(err, 'failed to connect to ecu');

    debug('error establishing a serial connection: %s', err);

    respondToConnectionRequests(err);
  } else {
    debug('serial connection established, running configuration function');

    // Bind listeners for data and errors
    conn.on('error', onSerialError);
    conn.on('data', onSerialData);

    return configureFn(conn)
      .then(function onConfigurationComplete () {
        debug('finished running configuration function, returning connection');

        conn.ready = true;

        respondToConnectionRequests();
      });
  }
}
