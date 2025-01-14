'use strict';

var core = require('../core');

/**
 * Pattern should contain either none or two capturing groups.
 * In case of two groups - 1st is raw, 2nd is clean.
 */
var patterns = {
  season: /([Ss]?([0-9]{1,2}))[Eex]|((?<=[\.\- ])[Ss]{1}([0-9]{1,2})(?=[\.\- ]))/,
  episode: /([Eex]{1}([0-9]{2})(?:[^0-9]|$))/,
  format: /NTSC|PAL|SECAM/,
  year: /([\[\(]?((?:19[0-9]|20[012])[0-9])[\]\)]?)/,
  resolution: /(([0-9]{3,4}p))[^M]/,
  quality: /(?:PPV.)?[HP]DTV|(?:HD)?CAM|B[rR]Rip|(?:PPV )?WEB-?DL(?: DVDRip)?|TS|H[dD]Rip|DVDRip|DVDRiP|DVDRIP|DVD[.\- ]?(?:5|9|10)?|CamRip|W[EB]B[rR]ip|WEB|[Bb]lu[Rr]ay|DvDScr|hdtv/,
  codec: /xvid|x264|x265|h.?264|AVC/i,
  audio: /MP3|DDP?[+\.]?[57].?1|DD2.?0|Dual[- ]Audio|LiNE|DTS(?:[.\- ]?)?(?:[Hh][Dd][.\- ]?)?(?:[Mm][Aa][.\- ]?)?(?:[567].1)?|AAC(?:.?2.0)?|FLAC(?:.?2.0)?|AC3(?:.5.1)?|(?:True[Hh][Dd].)?Atmos[. ]?(?:[579]\.1)?/,
  transcoding: /REMUX/i,
  container: /[\. ](MKV|AVI)[ $]?/i,
  group: /(- ?([^-]+(?:-={[^-]+-?$)?))$/,
  region: /R[0-9]/,
  extended: /EXTENDED/,
  hardcoded: /HC/,
  proper: /PROPER/,
  repack: /REPACK/,
  widescreen: /WS/,
  website: /^(\[ ?([^\]]+?) ?\])/,
  // language: /rus\.eng/,
  language: /rus.eng|FRENCH|RUSSIAN|SPANISH|JAPANESE|ENGLISH|KOREAN|PORTUGUESE|SWEDISH|VIETNAMESE|FINNISH|GERMAN|CHINESE|DANISH|ITALIAN/,
  platform: /DSNP|AMZN|NF|HMAX|CRITERION/,
  garbage: /1400Mb|3rd Nov| ((Rip))/,
  sub: /ENGSUB/,
};
var types = {
  season: 'integer',
  episode: 'integer',
  year: 'integer',
  extended: 'boolean',
  hardcoded: 'boolean',
  proper: 'boolean',
  repack: 'boolean',
  widescreen: 'boolean'
};
var torrent;

core.on('setup', function (data) {
  torrent = data;
});

core.on('start', function() {
  var key, match, index, clean, part;

  for(key in patterns) {
    if(!(match = torrent.name.match(patterns[key]))) {
      continue;
    }

    index = {
      raw:   match[1] ? 1 : 0,
      clean: match[1] ? 2 : 0
    };

    if (key === 'container' && !match[index.clean]) {
      index.clean = index.raw;
    }

    if(types[key] && types[key] === 'boolean') {
      clean = true;
    }
    else {
      clean = match[index.clean];

      if(types[key] && types[key] === 'integer') {
        /**
         * Some torrents are entire seasons and are named with <Show Name> S01
         * The old regex would only capture seasons when there was an included episode
         * The new regex will capture the S01 but needs to trim the S before parsing
         */
        if (key === 'season' && clean[0].match(/[Ss]/)) {
          clean = clean.slice(1);
        }

        clean = parseInt(clean, 10);
      }
    }

    if(key === 'group') {
      if(clean.match(patterns.codec) || clean.match(patterns.quality)) {
        continue;
      }

      if(clean.match(/[^ ]+ [^ ]+ .+/)) {
        key = 'episodeName';
      }

       /**
       * If the container name is at the end of the string it will get parsed with a group name ("<group>.mkv")
       * This will remove the group from the string if matches are found against the container pattern.
       */
      let containerMatch;
      if (containerMatch = clean.match(patterns.container)) {
        if (containerMatch[0] && containerMatch[1]) {
          clean = clean.replace(containerMatch[0], '');
        }
      }
    }

    /**
    * In an effort to catch any version of DTS which includes HD Master Audio
    * we can end up with trailing hyphens because DTS-HD-MA... needs to be captured
    * which means DTS-/DTS-HD/DTS-HD-MA- will also capture. 
    * This will shave off the trailing separator 
    */
    if (key === 'audio' && clean[clean.length - 1].match(/[\-\. ]/g)) {
      clean = clean.slice(0, -1);
    }

    part = {
      name: key,
      match: match,
      raw: match[index.raw],
      clean: clean
    };

    if(key === 'episode') {
      core.emit('map', torrent.name.replace(part.raw, '{episode}'));
    }

    core.emit('part', part);
  }

  core.emit('common');
});

core.on('late', function (part) {
  if(part.name === 'group') {
    core.emit('part', part);
  }
  else if(part.name === 'episodeName') {
    part.clean = part.clean.replace(/[\._]/g, ' ');
    part.clean = part.clean.replace(/_+$/, '').trim();
    core.emit('part', part);
  }
});
