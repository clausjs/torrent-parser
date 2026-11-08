'use strict';

var core = require('../core');

/**
 * Pattern should contain either none or two capturing groups (per season alternative).
 * In case of two groups - 1st is raw, 2nd is clean.
 */
var patterns = {
  season: /(?<![a-z0-9])((?:s|season[. _-]+)?([0-9]{1,3}))(?=[ex][0-9])|(?<![a-z0-9])((?:s|season[. _-]+)([0-9]{1,3}))(?![a-z0-9])/i,
  episode: /([Eex]{1}([0-9]{2})(?:[^0-9]|$))/,
  format: /NTSC|PAL|SECAM/,
  year: /([\[\(]?((?:19[0-9]|20[012])[0-9])[\]\)]?)/,
  resolution: /(?<![a-z0-9])(([0-9]{3,4}p))(?![a-z0-9])/i,
  quality: /(?<![a-z0-9])(?:(?:PPV[. ])?[HP]DTV|(?:HD)?CAM|B[RD]Rip|(?:PPV )?WEB-?DL(?: DVDRip)?|HDTS|TELESYNC|TS|U?HDRip|HDDVD|DVDRip|DVD[.\- ]?(?:5|9|10)?|CamRip|W[EB]B-?Rip|WEB|Blu-?Ray|DvDScr)(?=$|[^a-z0-9]|x26[45](?![a-z0-9]))/i,
  codec: /(?:(?<![a-z0-9])|(?<=HDTV))(?:xvid|x26[45]|h[. ]?26[45]|AVC)(?![a-z0-9])/i,
  audio: /(?<![a-z0-9])(?:MP3|DDP?[+.]?[. -]?[257][. ]?[01]|DDP|Dual[- ]Audio|DTS(?:[.\- ]?)?(?:HD[.\- ]?)?(?:MA[.\- ]?)?(?:[567][. ]1)?|AAC(?:[. -]?[25678][. ][01])?|FLAC(?:[. ]?[25678][. ][01])?|E-?AC3(?:[. -]?[25678][. ][01])?|AC3(?:[. -]?[25678][. ][01])?|TrueHD(?:[. ]?[257][. ][01])?(?:[. ]Atmos(?:[. ]?[579][. ]1)?)?|Atmos(?:[. ]?[579][. ]1)?)(?![a-z0-9])/i,
  transcoding: /REMUX/i,
  // Remove the full group before its container so excess does not retain the group.
  group: /(- ?([^-]+(?:-={[^-]+-?$)?))$/,
  container: /([. ](MKV|AVI))(?=$|[. \]\)-])/i,
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
    match = torrent.name.match(patterns[key]);
    // Prefer the explicit encoder/codec when a release also includes the HEVC alias.
    if(!match && key === 'codec') {
      match = torrent.name.match(/(?<![a-z0-9])HEVC(?![a-z0-9])/i);
    }
    // LiNE is case-sensitive so titles such as Whose Line Is It Anyway stay intact.
    if(!match && key === 'audio') {
      match = torrent.name.match(/(?<![a-z0-9])LiNE(?![a-z0-9])/);
    }
    if(!match) {
      continue;
    }

    index = {
      raw:   match[1] ? 1 : 0,
      clean: match[1] ? 2 : 0
    };

    if(key === 'season' && match[3]) {
      index = { raw: 3, clean: 4 };
    }

    if(types[key] && types[key] === 'boolean') {
      clean = true;
    }
    else {
      clean = match[index.clean];

      if(types[key] && types[key] === 'integer') {
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
