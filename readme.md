<!-- # parse-torrent-name [![Build Status](https://travis-ci.org/jzjzjzj/parse-torrent-name.svg?branch=master)](https://travis-ci.org/jzjzjzj/parse-torrent-name) [![Code Climate](https://codeclimate.com/github/jzjzjzj/parse-torrent-name/badges/gpa.svg)](https://codeclimate.com/github/jzjzjzj/parse-torrent-name) -->

# Torrent Parser (parse torrent name fork)
![Build Status](https://github.com/clausjs/parse-torrent-name/actions/workflows/node.js.yml/badge.svg)

Parses torrent name of a movie or TV show.

**Possible parts extracted:**

- audio
- codec
- transcoding
- container
- episode
- format
- episodeName
- excess
- extended
- garbage
- group
- hardcoded
- language
- proper
- quality
- region
- repack
- resolution
- season
- title
- website
- widescreen
- year

## Install:
```bash
$ npm install parse-torrent-name
```

## Usage:
```javascript
var ptn = require('parse-torrent-name');

ptn('The.Staying.Alive.S05E02.720p.HDTV.x264-KILLERS[rartv]');
/*
{ season: 5,
  episode: 2,
  resolution: '720p',
  quality: 'HDTV',
  codec: 'x264',
  group: 'KILLERS[rartv]',
  title: 'The Staying Alive' }
*/

ptn('Captain Russia The Summer Soldier (2014) 1080p BrRip x264 - YIFY');
/*
{ year: 2014,
  resolution: '1080p',
  quality: 'BrRip',
  codec: 'x264',
  group: 'YIFY',
  title: 'Captain Russia The Summer Soldier' }
*/

ptn('AL.288-1.2014.HC.HDRip.XViD.AC3-juggs[ETRG]');
/*
{ year: 2014,
  quality: 'HDRip',
  codec: 'XViD',
  audio: 'AC3',
  group: 'juggs[ETRG]',
  hardcoded: true,
  title: 'AL 288-1' }
*/
```
