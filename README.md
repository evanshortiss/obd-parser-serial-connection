obd-parser-serial-connection
============================

 [![Circle CI](https://circleci.com/gh/evanshortiss/obd-serial-connection/tree/master.svg?style=svg)](https://circleci.com/gh/evanshortiss/obd-serial-connection/tree/master)

Connection module for use with _odb-parser_.

## Install

```
npm install obd-parser-serial-connection
```

## Usage

The typical usage scenario is described in the _obd-parser_ module docs, but 
if you want to use this module to get a plain OBD connection you can use the 
example code below as a start.

```
var getConnector = require('obd-parser-serial-connection');

// Returns a function that will allow us to connect to the serial port
var connect = getConnector({
  serialPath: '/dev/tty.usbserial',
  serialOpts: {
    baudrate: 38400
  }
});

connect(configureFunction)
  .then(function () {
    console.log('connected to serial port!')
  })
  .catch(function (err) {
    console.error('oh noes');
  });


function configureFunction (connection) {
  return new Promise(function (resolve, reject) {
    // Set up the obd connection etc.
    conn.write('ATZ');
    conn.write('ATE0');
  });
}
```

## CHANGELOG

* 0.1.2 - Ensure errors result in Promise rejection. Use _debug_ instead of
_fhlog_.

* 0.1.1 - Patch for serialport 2.1.X changes in autoconnect

* 0.1.0 - Initial release

