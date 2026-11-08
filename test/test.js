'use strict';

let skipAdditional = false;
if (Boolean(process.env.NO_ADDITIONAL)) skipAdditional = true; 

const Ajv = require('ajv');
var ptn = require('..');
var tape = require('tape');
const { existsSync } = require('node:fs');
const path = require('node:path');

const ajv = new Ajv();
const testDataValidation = ajv.compile(require('../schema/test-data-schema.json'));

const data = require('./data.json');

tape('data.json is valid', function(t) {
  const validJsonData = testDataValidation(data);
  if (!validJsonData) {
    testDataValidation.errors.forEach((error) => {
      t.fail(`${error.message} at ${error.instancePath}: ${error.schemaPath}.`);
    });
  } else t.pass('data.json is valid.');
  t.end();
});

let torrents;
if (!skipAdditional && existsSync(path.join(__dirname, './additional-data.json'))) {
  const additional = require('./additional-data.json');
  
  tape('additional-data.json is valid', function(t) {
    const validAdditionalData = testDataValidation(additional);
    if (!validAdditionalData) {
      testDataValidation.errors.forEach((error) => {
        t.fail(`${error.message} at ${error.instancePath}: ${error.schemaPath}.`);
      });
    } else t.pass('additional-data.json is valid.');
    t.end();
  });

  torrents = data.concat(additional);
} 
else torrents = data;


torrents.forEach(function(torrent) {
  var testName = '"' + torrent.name + '"';
  var parts = ptn(torrent.name);

  tape(testName, function (test) {
    var key, testMessage;

    for(key in torrent) {
      if(key === 'name') {
        continue;
      }

      testMessage = key + ': ' + JSON.stringify(torrent[key]);

      test[Array.isArray(torrent[key]) ? 'deepEqual' : 'equal'](
        parts[key],
        torrent[key],
        testMessage
      );
    }

    test.end();
  });
});

tape('torrent filenames preserve release metadata', function(test) {
  torrents.forEach(function(torrent) {
    const releaseName = torrent.name.replace(/\.torrent$/i, '');
    test.deepEqual(ptn(releaseName + '.torrent'), ptn(releaseName), releaseName);
  });
  test.deepEqual(ptn('Example.S01E02.1080p.WEB.H265-GROUP.mkv.torrent'), {
    season: 1,
    episode: 2,
    resolution: '1080p',
    quality: 'WEB',
    codec: 'H265',
    group: 'GROUP',
    container: 'mkv',
    title: 'Example'
  }, 'media extensions do not leave group names in excess');
  test.equal(ptn('Example.torrent.2024.1080p').title, 'Example torrent',
    'only a terminal torrent extension is removed');
  test.end();
});

tape('metadata requires token boundaries', function(test) {
  [
    ['Example720p', 'resolution'],
    ['Example.720pMkv.Com', 'resolution'],
    ['Example.1080pixels', 'resolution'],
    ['Example.S0123', 'season'],
    ['ExampleS01', 'season'],
    ['Example.Season 1234', 'season'],
    ['WEBSter.2024', 'quality'],
    ['CAMpus.2024', 'quality'],
    ['Example.1080p.DTS-HD.MA.5.1', 'quality'],
    ['Example.1080p.x2650', 'codec'],
    ['Example.1080p.Ha264', 'codec'],
    ['Example.1080p.HEVCish', 'codec'],
    ['Example.1080p.EAC3PO', 'audio']
  ].forEach(function(sample) {
    test.equal(ptn(sample[0])[sample[1]], undefined, sample[0] + ': no ' + sample[1]);
  });
  test.end();
});
