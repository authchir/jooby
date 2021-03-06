/*
  Rollup.js v0.19.1
  Sun Oct 11 2015 11:46:46 GMT-0400 (EDT) - commit b8dd8c4b492f0c0d6ec13f94e3407d63f62d0890

  https://github.com/rollup/rollup

  Released under the MIT License.
*/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory((global.rollup = {}));
}(this, function (exports) { 'use strict';

  var babelHelpers_toConsumableArray = function (arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  var babelHelpers_classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  // TODO does this all work on windows?

  var absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|\/])/;

  function isAbsolute(path) {
    return absolutePath.test(path);
  }

  function _basename(path) {
    return path.split(/(\/|\\)/).pop();
  }

  function dirname(path) {
    var match = /(\/|\\)[^\/\\]*$/.exec(path);
    if (!match) return '.';

    var dir = path.slice(0, -match[0].length);

    // If `dir` is the empty string, we're at root.
    return dir ? dir : '/';
  }

  function extname(path) {
    var match = /\.[^\.]+$/.exec(path);
    if (!match) return '';
    return match[0];
  }

  function resolve() {
    for (var _len = arguments.length, paths = Array(_len), _key = 0; _key < _len; _key++) {
      paths[_key] = arguments[_key];
    }

    var resolvedParts = paths.shift().split(/[\/\\]/);

    paths.forEach(function (path) {
      if (isAbsolute(path)) {
        resolvedParts = path.split(/[\/\\]/);
      } else {
        var parts = path.split(/[\/\\]/);

        while (parts[0] === '.' || parts[0] === '..') {
          var part = parts.shift();
          if (part === '..') {
            resolvedParts.pop();
          }
        }

        resolvedParts.push.apply(resolvedParts, parts);
      }
    });

    return resolvedParts.join('/'); // TODO windows...
  }

  var nope = function (method) {
    return 'Cannot use fs.' + method + ' inside browser';
  };

  var readdirSync = nope('readdirSync');
  var readFileSync = nope('readFileSync');
  var writeFile = nope('writeFile');

  var keys = Object.keys;

  function blank() {
    return Object.create(null);
  }

  // this looks ridiculous, but it prevents sourcemap tooling from mistaking
  // this for an actual sourceMappingURL
  var SOURCEMAPPING_URL = 'sourceMa';
  SOURCEMAPPING_URL += 'ppingURL';

  var SOURCEMAPPING_URL$1 = SOURCEMAPPING_URL;

  var Promise$1 = window.Promise;

  var _btoa;

  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    _btoa = window.btoa;
  } else if (typeof Buffer === 'function') {
    _btoa = function (str) {
      return new Buffer(str).toString('base64');
    };
  } else {
    throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
  }

  var btoa = _btoa;

  var SourceMap = (function () {
    function SourceMap(properties) {
      babelHelpers_classCallCheck(this, SourceMap);

      this.version = 3;

      this.file = properties.file;
      this.sources = properties.sources;
      this.sourcesContent = properties.sourcesContent;
      this.names = properties.names;
      this.mappings = properties.mappings;
    }

    SourceMap.prototype.toString = function toString() {
      return JSON.stringify(this);
    };

    SourceMap.prototype.toUrl = function toUrl() {
      return 'data:application/json;charset=utf-8;base64,' + btoa(this.toString());
    };

    return SourceMap;
  })();

  function guessIndent(code) {
    var lines = code.split('\n');

    var tabbed = lines.filter(function (line) {
      return (/^\t+/.test(line)
      );
    });
    var spaced = lines.filter(function (line) {
      return (/^ {2,}/.test(line)
      );
    });

    if (tabbed.length === 0 && spaced.length === 0) {
      return null;
    }

    // More lines tabbed than spaced? Assume tabs, and
    // default to tabs in the case of a tie (or nothing
    // to go on)
    if (tabbed.length >= spaced.length) {
      return '\t';
    }

    // Otherwise, we need to guess the multiple
    var min = spaced.reduce(function (previous, current) {
      var numSpaces = /^ +/.exec(current)[0].length;
      return Math.min(numSpaces, previous);
    }, Infinity);

    return new Array(min + 1).join(' ');
  }

  var charToInteger = {};
  var integerToChar = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('').forEach(function (char, i) {
    charToInteger[char] = i;
    integerToChar[i] = char;
  });

  function decode$1(string) {
    var result = [],
        len = string.length,
        i,
        hasContinuationBit,
        shift = 0,
        value = 0,
        integer,
        shouldNegate;

    for (i = 0; i < len; i += 1) {
      integer = charToInteger[string[i]];

      if (integer === undefined) {
        throw new Error('Invalid character (' + string[i] + ')');
      }

      hasContinuationBit = integer & 32;

      integer &= 31;
      value += integer << shift;

      if (hasContinuationBit) {
        shift += 5;
      } else {
        shouldNegate = value & 1;
        value >>= 1;

        result.push(shouldNegate ? -value : value);

        // reset
        value = shift = 0;
      }
    }

    return result;
  }

  function encode$1(value) {
    var result, i;

    if (typeof value === 'number') {
      result = encodeInteger(value);
    } else {
      result = '';
      for (i = 0; i < value.length; i += 1) {
        result += encodeInteger(value[i]);
      }
    }

    return result;
  }

  function encodeInteger(num) {
    var result = '',
        clamped;

    if (num < 0) {
      num = -num << 1 | 1;
    } else {
      num <<= 1;
    }

    do {
      clamped = num & 31;
      num >>= 5;

      if (num > 0) {
        clamped |= 32;
      }

      result += integerToChar[clamped];
    } while (num > 0);

    return result;
  }

  function encodeMappings(original, str, mappings, hires, sourcemapLocations, sourceIndex, offsets, names, nameLocations) {
    // store locations, for fast lookup
    var lineStart = 0;
    var locations = original.split('\n').map(function (line) {
      var start = lineStart;
      lineStart += line.length + 1; // +1 for the newline

      return start;
    });

    var inverseMappings = invert(str, mappings);

    var charOffset = 0;
    var lines = str.split('\n').map(function (line) {
      var segments = [];

      var char = undefined; // TODO put these inside loop, once we've determined it's safe to do so transpilation-wise
      var origin = undefined;
      var lastOrigin = -1;
      var location = undefined;
      var nameIndex = undefined;

      var i = undefined;

      var len = line.length;
      for (i = 0; i < len; i += 1) {
        char = i + charOffset;
        origin = inverseMappings[char];

        nameIndex = -1;
        location = null;

        // if this character has no mapping, but the last one did,
        // create a new segment
        if (! ~origin && ~lastOrigin) {
          location = getLocation$1(locations, lastOrigin + 1);

          if (lastOrigin + 1 in nameLocations) nameIndex = names.indexOf(nameLocations[lastOrigin + 1]);
        } else if (~origin && (hires || ~lastOrigin && origin !== lastOrigin + 1 || sourcemapLocations[origin])) {
          location = getLocation$1(locations, origin);
        }

        if (location) {
          segments.push({
            generatedCodeColumn: i,
            sourceIndex: sourceIndex,
            sourceCodeLine: location.line,
            sourceCodeColumn: location.column,
            sourceCodeName: nameIndex
          });
        }

        lastOrigin = origin;
      }

      charOffset += line.length + 1;
      return segments;
    });

    offsets.sourceIndex = offsets.sourceIndex || 0;
    offsets.sourceCodeLine = offsets.sourceCodeLine || 0;
    offsets.sourceCodeColumn = offsets.sourceCodeColumn || 0;
    offsets.sourceCodeName = offsets.sourceCodeName || 0;

    var encoded = lines.map(function (segments) {
      var generatedCodeColumn = 0;

      return segments.map(function (segment) {
        var arr = [segment.generatedCodeColumn - generatedCodeColumn, segment.sourceIndex - offsets.sourceIndex, segment.sourceCodeLine - offsets.sourceCodeLine, segment.sourceCodeColumn - offsets.sourceCodeColumn];

        generatedCodeColumn = segment.generatedCodeColumn;
        offsets.sourceIndex = segment.sourceIndex;
        offsets.sourceCodeLine = segment.sourceCodeLine;
        offsets.sourceCodeColumn = segment.sourceCodeColumn;

        if (~segment.sourceCodeName) {
          arr.push(segment.sourceCodeName - offsets.sourceCodeName);
          offsets.sourceCodeName = segment.sourceCodeName;
        }

        return encode$1(arr);
      }).join(',');
    }).join(';');

    return encoded;
  }

  function invert(str, mappings) {
    var inverted = new Uint32Array(str.length),
        i;

    // initialise everything to -1
    i = str.length;
    while (i--) {
      inverted[i] = -1;
    }

    // then apply the actual mappings
    i = mappings.length;
    while (i--) {
      if (~mappings[i]) {
        inverted[mappings[i]] = i;
      }
    }

    return inverted;
  }

  function getLocation$1(locations, char) {
    var i;

    i = locations.length;
    while (i--) {
      if (locations[i] <= char) {
        return {
          line: i,
          column: char - locations[i]
        };
      }
    }

    throw new Error('Character out of bounds');
  }

  function getRelativePath(from, to) {
    var fromParts = from.split(/[\/\\]/);
    var toParts = to.split(/[\/\\]/);

    fromParts.pop(); // get dirname

    while (fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }

    if (fromParts.length) {
      var i = fromParts.length;
      while (i--) fromParts[i] = '..';
    }

    return fromParts.concat(toParts).join('/');
  }

  var warned = false;

  var MagicString = (function () {
    function MagicString(string) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      babelHelpers_classCallCheck(this, MagicString);

      this.original = this.str = string;
      this.mappings = initMappings(string.length);

      this.filename = options.filename;
      this.indentExclusionRanges = options.indentExclusionRanges;

      this.sourcemapLocations = {};
      this.nameLocations = {};

      this.indentStr = guessIndent(string);
    }

    MagicString.prototype.addSourcemapLocation = function addSourcemapLocation(char) {
      this.sourcemapLocations[char] = true;
    };

    MagicString.prototype.append = function append(content) {
      if (typeof content !== 'string') {
        throw new TypeError('appended content must be a string');
      }

      this.str += content;
      return this;
    };

    MagicString.prototype.clone = function clone() {
      var clone, i;

      clone = new MagicString(this.original, { filename: this.filename });
      clone.str = this.str;

      i = clone.mappings.length;
      while (i--) {
        clone.mappings[i] = this.mappings[i];
      }

      if (this.indentExclusionRanges) {
        clone.indentExclusionRanges = typeof this.indentExclusionRanges[0] === 'number' ? [this.indentExclusionRanges[0], this.indentExclusionRanges[1]] : this.indentExclusionRanges.map(function (_ref) {
          var start = _ref[0];
          var end = _ref[1];
          return [start, end];
        });
      }

      Object.keys(this.sourcemapLocations).forEach(function (loc) {
        clone.sourcemapLocations[loc] = true;
      });

      return clone;
    };

    MagicString.prototype.generateMap = function generateMap(options) {
      var _this = this;

      options = options || {};

      var names = [];
      Object.keys(this.nameLocations).forEach(function (location) {
        var name = _this.nameLocations[location];
        if (! ~names.indexOf(name)) names.push(name);
      });

      return new SourceMap({
        file: options.file ? options.file.split(/[\/\\]/).pop() : null,
        sources: [options.source ? getRelativePath(options.file || '', options.source) : null],
        sourcesContent: options.includeContent ? [this.original] : [null],
        names: names,
        mappings: this.getMappings(options.hires, 0, {}, names)
      });
    };

    MagicString.prototype.getIndentString = function getIndentString() {
      return this.indentStr === null ? '\t' : this.indentStr;
    };

    MagicString.prototype.getMappings = function getMappings(hires, sourceIndex, offsets, names) {
      return encodeMappings(this.original, this.str, this.mappings, hires, this.sourcemapLocations, sourceIndex, offsets, names, this.nameLocations);
    };

    MagicString.prototype.indent = function indent(indentStr, options) {
      var self = this,
          mappings = this.mappings,
          reverseMappings = reverse(mappings, this.str.length),
          pattern = /^[^\r\n]/gm,
          match,
          inserts = [],
          adjustments,
          exclusions,
          lastEnd,
          i;

      if (typeof indentStr === 'object') {
        options = indentStr;
        indentStr = undefined;
      }

      indentStr = indentStr !== undefined ? indentStr : this.indentStr || '\t';

      if (indentStr === '') return this; // noop

      options = options || {};

      // Process exclusion ranges
      if (options.exclude) {
        exclusions = typeof options.exclude[0] === 'number' ? [options.exclude] : options.exclude;

        exclusions = exclusions.map(function (range) {
          var rangeStart, rangeEnd;

          rangeStart = self.locate(range[0]);
          rangeEnd = self.locate(range[1]);

          if (rangeStart === null || rangeEnd === null) {
            throw new Error('Cannot use indices of replaced characters as exclusion ranges');
          }

          return [rangeStart, rangeEnd];
        });

        exclusions.sort(function (a, b) {
          return a[0] - b[0];
        });

        // check for overlaps
        lastEnd = -1;
        exclusions.forEach(function (range) {
          if (range[0] < lastEnd) {
            throw new Error('Exclusion ranges cannot overlap');
          }

          lastEnd = range[1];
        });
      }

      var indentStart = options.indentStart !== false;

      if (!exclusions) {
        this.str = this.str.replace(pattern, function (match, index) {
          if (!indentStart && index === 0) {
            return match;
          }

          inserts.push(index);
          return indentStr + match;
        });
      } else {
        this.str = this.str.replace(pattern, function (match, index) {
          if (!indentStart && index === 0 || isExcluded(index - 1)) {
            return match;
          }

          inserts.push(index);
          return indentStr + match;
        });
      }

      adjustments = inserts.map(function (index) {
        var origin;

        do {
          origin = reverseMappings[index++];
        } while (! ~origin && index < self.str.length);

        return origin;
      });

      i = adjustments.length;
      lastEnd = this.mappings.length;
      while (i--) {
        adjust(self.mappings, adjustments[i], lastEnd, (i + 1) * indentStr.length);
        lastEnd = adjustments[i];
      }

      return this;

      function isExcluded(index) {
        var i = exclusions.length,
            range;

        while (i--) {
          range = exclusions[i];

          if (range[1] < index) {
            return false;
          }

          if (range[0] <= index) {
            return true;
          }
        }
      }
    };

    MagicString.prototype.insert = function insert(index, content) {
      if (typeof content !== 'string') {
        throw new TypeError('inserted content must be a string');
      }

      if (index === this.original.length) {
        this.append(content);
      } else {
        var mapped = this.locate(index);

        if (mapped === null) {
          throw new Error('Cannot insert at replaced character index: ' + index);
        }

        this.str = this.str.substr(0, mapped) + content + this.str.substr(mapped);
        adjust(this.mappings, index, this.mappings.length, content.length);
      }

      return this;
    };

    // get current location of character in original string

    MagicString.prototype.locate = function locate(character) {
      var loc;

      if (character < 0 || character > this.mappings.length) {
        throw new Error('Character is out of bounds');
      }

      loc = this.mappings[character];
      return ~loc ? loc : null;
    };

    MagicString.prototype.locateOrigin = function locateOrigin(character) {
      var i;

      if (character < 0 || character >= this.str.length) {
        throw new Error('Character is out of bounds');
      }

      i = this.mappings.length;
      while (i--) {
        if (this.mappings[i] === character) {
          return i;
        }
      }

      return null;
    };

    MagicString.prototype.overwrite = function overwrite(start, end, content, storeName) {
      if (typeof content !== 'string') {
        throw new TypeError('replacement content must be a string');
      }

      var firstChar, lastChar, d;

      firstChar = this.locate(start);
      lastChar = this.locate(end - 1);

      if (firstChar === null || lastChar === null) {
        throw new Error('Cannot overwrite the same content twice: \'' + this.original.slice(start, end).replace(/\n/g, '\\n') + '\'');
      }

      if (firstChar > lastChar + 1) {
        throw new Error('BUG! First character mapped to a position after the last character: ' + '[' + start + ', ' + end + '] -> [' + firstChar + ', ' + (lastChar + 1) + ']');
      }

      if (storeName) {
        this.nameLocations[start] = this.original.slice(start, end);
      }

      this.str = this.str.substr(0, firstChar) + content + this.str.substring(lastChar + 1);

      d = content.length - (lastChar + 1 - firstChar);

      blank$1(this.mappings, start, end);
      adjust(this.mappings, end, this.mappings.length, d);
      return this;
    };

    MagicString.prototype.prepend = function prepend(content) {
      this.str = content + this.str;
      adjust(this.mappings, 0, this.mappings.length, content.length);
      return this;
    };

    MagicString.prototype.remove = function remove(start, end) {
      if (start < 0 || end > this.mappings.length) {
        throw new Error('Character is out of bounds');
      }

      var currentStart = -1;
      var currentEnd = -1;
      for (var i = start; i < end; i += 1) {
        var loc = this.mappings[i];

        if (~loc) {
          if (! ~currentStart) currentStart = loc;

          currentEnd = loc + 1;
          this.mappings[i] = -1;
        }
      }

      this.str = this.str.slice(0, currentStart) + this.str.slice(currentEnd);

      adjust(this.mappings, end, this.mappings.length, currentStart - currentEnd);
      return this;
    };

    MagicString.prototype.replace = function replace(start, end, content) {
      if (!warned) {
        console.warn('magicString.replace(...) is deprecated. Use magicString.overwrite(...) instead');
        warned = true;
      }

      return this.overwrite(start, end, content);
    };

    MagicString.prototype.slice = function slice(start) {
      var end = arguments.length <= 1 || arguments[1] === undefined ? this.original.length : arguments[1];

      var firstChar, lastChar;

      while (start < 0) start += this.original.length;
      while (end < 0) end += this.original.length;

      firstChar = this.locate(start);
      lastChar = this.locate(end - 1);

      if (firstChar === null || lastChar === null) {
        throw new Error('Cannot use replaced characters as slice anchors');
      }

      return this.str.slice(firstChar, lastChar + 1);
    };

    MagicString.prototype.snip = function snip(start, end) {
      var clone = this.clone();
      clone.remove(0, start);
      clone.remove(end, clone.original.length);

      return clone;
    };

    MagicString.prototype.toString = function toString() {
      return this.str;
    };

    MagicString.prototype.trimLines = function trimLines() {
      return this.trim('[\\r\\n]');
    };

    MagicString.prototype.trim = function trim(charType) {
      return this.trimStart(charType).trimEnd(charType);
    };

    MagicString.prototype.trimEnd = function trimEnd(charType) {
      var self = this;
      var rx = new RegExp((charType || '\\s') + '+$');

      this.str = this.str.replace(rx, function (trailing, index, str) {
        var strLength = str.length,
            length = trailing.length,
            i,
            chars = [];

        i = strLength;
        while (i-- > strLength - length) {
          chars.push(self.locateOrigin(i));
        }

        i = chars.length;
        while (i--) {
          if (chars[i] !== null) {
            self.mappings[chars[i]] = -1;
          }
        }

        return '';
      });

      return this;
    };

    MagicString.prototype.trimStart = function trimStart(charType) {
      var self = this;
      var rx = new RegExp('^' + (charType || '\\s') + '+');

      this.str = this.str.replace(rx, function (leading) {
        var length = leading.length,
            i,
            chars = [],
            adjustmentStart = 0;

        i = length;
        while (i--) {
          chars.push(self.locateOrigin(i));
        }

        i = chars.length;
        while (i--) {
          if (chars[i] !== null) {
            self.mappings[chars[i]] = -1;
            adjustmentStart += 1;
          }
        }

        adjust(self.mappings, adjustmentStart, self.mappings.length, -length);

        return '';
      });

      return this;
    };

    return MagicString;
  })();

  function adjust(mappings, start, end, d) {
    var i = end;

    if (!d) return; // replacement is same length as replaced string

    while (i-- > start) {
      if (~mappings[i]) {
        mappings[i] += d;
      }
    }
  }

  function initMappings(i) {
    var mappings = new Uint32Array(i);

    while (i--) {
      mappings[i] = i;
    }

    return mappings;
  }

  function blank$1(mappings, start, i) {
    while (i-- > start) {
      mappings[i] = -1;
    }
  }

  function reverse(mappings, i) {
    var result, location;

    result = new Uint32Array(i);

    while (i--) {
      result[i] = -1;
    }

    i = mappings.length;
    while (i--) {
      location = mappings[i];

      if (~location) {
        result[location] = i;
      }
    }

    return result;
  }

  var hasOwnProp = Object.prototype.hasOwnProperty;

  var Bundle$1 = (function () {
    function Bundle() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      babelHelpers_classCallCheck(this, Bundle);

      this.intro = options.intro || '';
      this.outro = options.outro || '';
      this.separator = options.separator !== undefined ? options.separator : '\n';

      this.sources = [];

      this.uniqueSources = [];
      this.uniqueSourceIndexByFilename = {};
    }

    Bundle.prototype.addSource = function addSource(source) {
      if (source instanceof MagicString) {
        return this.addSource({
          content: source,
          filename: source.filename,
          separator: this.separator
        });
      }

      if (typeof source !== 'object' || !source.content) {
        throw new Error('bundle.addSource() takes an object with a `content` property, which should be an instance of MagicString, and an optional `filename`');
      }

      ['filename', 'indentExclusionRanges', 'separator'].forEach(function (option) {
        if (!hasOwnProp.call(source, option)) source[option] = source.content[option];
      });

      if (source.separator === undefined) {
        // TODO there's a bunch of this sort of thing, needs cleaning up
        source.separator = this.separator;
      }

      if (source.filename) {
        if (!hasOwnProp.call(this.uniqueSourceIndexByFilename, source.filename)) {
          this.uniqueSourceIndexByFilename[source.filename] = this.uniqueSources.length;
          this.uniqueSources.push({ filename: source.filename, content: source.content.original });
        } else {
          var uniqueSource = this.uniqueSources[this.uniqueSourceIndexByFilename[source.filename]];
          if (source.content.original !== uniqueSource.content) {
            throw new Error('Illegal source: same filename (' + source.filename + '), different contents');
          }
        }
      }

      this.sources.push(source);
      return this;
    };

    Bundle.prototype.append = function append(str, options) {
      this.addSource({
        content: new MagicString(str),
        separator: options && options.separator || ''
      });

      return this;
    };

    Bundle.prototype.clone = function clone() {
      var bundle = new Bundle({
        intro: this.intro,
        outro: this.outro,
        separator: this.separator
      });

      this.sources.forEach(function (source) {
        bundle.addSource({
          filename: source.filename,
          content: source.content.clone(),
          separator: source.separator
        });
      });

      return bundle;
    };

    Bundle.prototype.generateMap = function generateMap(options) {
      var _this = this;

      var offsets = {};

      var names = [];
      this.sources.forEach(function (source) {
        Object.keys(source.content.nameLocations).forEach(function (location) {
          var name = source.content.nameLocations[location];
          if (! ~names.indexOf(name)) names.push(name);
        });
      });

      var encoded = getSemis(this.intro) + this.sources.map(function (source, i) {
        var prefix = i > 0 ? getSemis(source.separator) || ',' : '';
        var mappings = undefined;

        // we don't bother encoding sources without a filename
        if (!source.filename) {
          mappings = getSemis(source.content.toString());
        } else {
          var sourceIndex = _this.uniqueSourceIndexByFilename[source.filename];
          mappings = source.content.getMappings(options.hires, sourceIndex, offsets, names);
        }

        return prefix + mappings;
      }).join('') + getSemis(this.outro);

      return new SourceMap({
        file: options.file ? options.file.split(/[\/\\]/).pop() : null,
        sources: this.uniqueSources.map(function (source) {
          return options.file ? getRelativePath(options.file, source.filename) : source.filename;
        }),
        sourcesContent: this.uniqueSources.map(function (source) {
          return options.includeContent ? source.content : null;
        }),
        names: names,
        mappings: encoded
      });
    };

    Bundle.prototype.getIndentString = function getIndentString() {
      var indentStringCounts = {};

      this.sources.forEach(function (source) {
        var indentStr = source.content.indentStr;

        if (indentStr === null) return;

        if (!indentStringCounts[indentStr]) indentStringCounts[indentStr] = 0;
        indentStringCounts[indentStr] += 1;
      });

      return Object.keys(indentStringCounts).sort(function (a, b) {
        return indentStringCounts[a] - indentStringCounts[b];
      })[0] || '\t';
    };

    Bundle.prototype.indent = function indent(indentStr) {
      var _this2 = this;

      if (!arguments.length) {
        indentStr = this.getIndentString();
      }

      if (indentStr === '') return this; // noop

      var trailingNewline = !this.intro || this.intro.slice(-1) === '\n';

      this.sources.forEach(function (source, i) {
        var separator = source.separator !== undefined ? source.separator : _this2.separator;
        var indentStart = trailingNewline || i > 0 && /\r?\n$/.test(separator);

        source.content.indent(indentStr, {
          exclude: source.indentExclusionRanges,
          indentStart: indentStart //: trailingNewline || /\r?\n$/.test( separator )  //true///\r?\n/.test( separator )
        });

        trailingNewline = source.content.str.slice(0, -1) === '\n';
      });

      if (this.intro) {
        this.intro = indentStr + this.intro.replace(/^[^\n]/gm, function (match, index) {
          return index > 0 ? indentStr + match : match;
        });
      }

      this.outro = this.outro.replace(/^[^\n]/gm, indentStr + '$&');

      return this;
    };

    Bundle.prototype.prepend = function prepend(str) {
      this.intro = str + this.intro;
      return this;
    };

    Bundle.prototype.toString = function toString() {
      var _this3 = this;

      var body = this.sources.map(function (source, i) {
        var separator = source.separator !== undefined ? source.separator : _this3.separator;
        var str = (i > 0 ? separator : '') + source.content.toString();

        return str;
      }).join('');

      return this.intro + body + this.outro;
    };

    Bundle.prototype.trimLines = function trimLines() {
      return this.trim('[\\r\\n]');
    };

    Bundle.prototype.trim = function trim(charType) {
      return this.trimStart(charType).trimEnd(charType);
    };

    Bundle.prototype.trimStart = function trimStart(charType) {
      var rx = new RegExp('^' + (charType || '\\s') + '+');
      this.intro = this.intro.replace(rx, '');

      if (!this.intro) {
        var source = undefined; // TODO put inside loop if safe
        var i = 0;

        do {
          source = this.sources[i];

          if (!source) {
            this.outro = this.outro.replace(rx, '');
            break;
          }

          source.content.trimStart();
          i += 1;
        } while (source.content.str === '');
      }

      return this;
    };

    Bundle.prototype.trimEnd = function trimEnd(charType) {
      var rx = new RegExp((charType || '\\s') + '+$');
      this.outro = this.outro.replace(rx, '');

      if (!this.outro) {
        var source = undefined;
        var i = this.sources.length - 1;

        do {
          source = this.sources[i];

          if (!source) {
            this.intro = this.intro.replace(rx, '');
            break;
          }

          source.content.trimEnd(charType);
          i -= 1;
        } while (source.content.str === '');
      }

      return this;
    };

    return Bundle;
  })();

  function getSemis(str) {
    return new Array(str.split('\n').length).join(';');
  }

  MagicString.Bundle = Bundle$1;

  // Return the first non-falsy result from an array of
  // maybe-sync, maybe-promise-returning functions

  function first$1(candidates) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return candidates.reduce(function (promise, candidate) {
        return promise.then(function (result) {
          return result != null ? result : Promise.resolve(candidate.apply(undefined, args));
        });
      }, Promise.resolve());
    };
  }

  // This is a trick taken from Esprima. It turns out that, on
  // non-Chrome browsers, to check whether a string is in a set, a
  // predicate containing a big ugly `switch` statement is faster than
  // a regular expression, and on Chrome the two are about on par.
  // This function uses `eval` (non-lexical) to produce such a
  // predicate from a space-separated string of words.
  //
  // It starts by sorting the words by length.

  function makePredicate(words) {
    words = words.split(" ");
    var f = "",
        cats = [];
    out: for (var i = 0; i < words.length; ++i) {
      for (var j = 0; j < cats.length; ++j) {
        if (cats[j][0].length == words[i].length) {
          cats[j].push(words[i]);
          continue out;
        }
      }cats.push([words[i]]);
    }
    function compareTo(arr) {
      if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
      f += "switch(str){";
      for (var i = 0; i < arr.length; ++i) {
        f += "case " + JSON.stringify(arr[i]) + ":";
      }f += "return true}return false;";
    }

    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.

    if (cats.length > 3) {
      cats.sort(function (a, b) {
        return b.length - a.length;
      });
      f += "switch(str.length){";
      for (var i = 0; i < cats.length; ++i) {
        var cat = cats[i];
        f += "case " + cat[0].length + ":";
        compareTo(cat);
      }
      f += "}";

      // Otherwise, simply generate a flat `switch` statement.
    } else {
        compareTo(words);
      }
    return new Function("str", f);
  }

  // Reserved word lists for various dialects of the language

  var reservedWords$1 = {
    3: makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile"),
    5: makePredicate("class enum extends super const export import"),
    6: makePredicate("enum await"),
    strict: makePredicate("implements interface let package private protected public static yield"),
    strictBind: makePredicate("eval arguments")
  };

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

  var keywords = {
    5: makePredicate(ecma5AndLessKeywords),
    6: makePredicate(ecma5AndLessKeywords + " let const class extends export import yield super")
  };

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.
  // Generated by `tools/generate-identifier-regex.js`.

  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b2\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua7ad\ua7b0\ua7b1\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab5f\uab64\uab65\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfc-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2d\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range. They were
  // generated by tools/generate-identifier-regex.js
  var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 99, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 98, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 955, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 38, 17, 2, 24, 133, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 32, 4, 287, 47, 21, 1, 2, 0, 185, 46, 82, 47, 21, 0, 60, 42, 502, 63, 32, 0, 449, 56, 1288, 920, 104, 110, 2962, 1070, 13266, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 16481, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 1340, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 16355, 541];
  var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 16, 9, 83, 11, 168, 11, 6, 9, 8, 2, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 316, 19, 13, 9, 214, 6, 3, 8, 112, 16, 16, 9, 82, 12, 9, 9, 535, 9, 20855, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 4305, 6, 792618, 239];

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000;
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i];
      if (pos > code) return false;
      pos += set[i + 1];
      if (pos >= code) return true;
    }
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) return code === 36;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123) return true;
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
    if (astral === false) return false;
    return isInAstralSet(code, astralIdentifierStartCodes);
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) return code === 36;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123) return true;
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
    if (astral === false) return false;
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType = function TokenType(label) {
    var conf = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    babelHelpers_classCallCheck(this, TokenType);

    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop || null;
    this.updateContext = null;
  };

  function binop(name, prec) {
    return new TokenType(name, { beforeExpr: true, binop: prec });
  }
  var beforeExpr = { beforeExpr: true };
  var startsExpr = { startsExpr: true };
  var tt = {
    num: new TokenType("num", startsExpr),
    regexp: new TokenType("regexp", startsExpr),
    string: new TokenType("string", startsExpr),
    name: new TokenType("name", startsExpr),
    eof: new TokenType("eof"),

    // Punctuation token types.
    bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
    bracketR: new TokenType("]"),
    braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
    braceR: new TokenType("}"),
    parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
    parenR: new TokenType(")"),
    comma: new TokenType(",", beforeExpr),
    semi: new TokenType(";", beforeExpr),
    colon: new TokenType(":", beforeExpr),
    dot: new TokenType("."),
    question: new TokenType("?", beforeExpr),
    arrow: new TokenType("=>", beforeExpr),
    template: new TokenType("template"),
    ellipsis: new TokenType("...", beforeExpr),
    backQuote: new TokenType("`", startsExpr),
    dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
    assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
    incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
    prefix: new TokenType("prefix", { beforeExpr: true, prefix: true, startsExpr: true }),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=", 6),
    relational: binop("</>", 7),
    bitShift: binop("<</>>", 8),
    plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10)
  };

  // Map keyword names to token types.

  var keywordTypes = {};

  // Succinct definitions of keyword token types
  function kw(name) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    options.keyword = name;
    keywordTypes[name] = tt["_" + name] = new TokenType(name, options);
  }

  kw("break");
  kw("case", beforeExpr);
  kw("catch");
  kw("continue");
  kw("debugger");
  kw("default", beforeExpr);
  kw("do", { isLoop: true });
  kw("else", beforeExpr);
  kw("finally");
  kw("for", { isLoop: true });
  kw("function", startsExpr);
  kw("if");
  kw("return", beforeExpr);
  kw("switch");
  kw("throw", beforeExpr);
  kw("try");
  kw("var");
  kw("let");
  kw("const");
  kw("while", { isLoop: true });
  kw("with");
  kw("new", { beforeExpr: true, startsExpr: true });
  kw("this", startsExpr);
  kw("super", startsExpr);
  kw("class");
  kw("extends", beforeExpr);
  kw("export");
  kw("import");
  kw("yield", { beforeExpr: true, startsExpr: true });
  kw("null", startsExpr);
  kw("true", startsExpr);
  kw("false", startsExpr);
  kw("in", { beforeExpr: true, binop: 7 });
  kw("instanceof", { beforeExpr: true, binop: 7 });
  kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true });
  kw("void", { beforeExpr: true, prefix: true, startsExpr: true });
  kw("delete", { beforeExpr: true, prefix: true, startsExpr: true });

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/;
  var lineBreakG = new RegExp(lineBreak.source, "g");

  function isNewLine(code) {
    return code === 10 || code === 13 || code === 0x2028 || code == 0x2029;
  }

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

  function isArray$1(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  }

  // Checks if an object has a property.

  function has(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName);
  }

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = (function () {
    function Position(line, col) {
      babelHelpers_classCallCheck(this, Position);

      this.line = line;
      this.column = col;
    }

    Position.prototype.offset = function offset(n) {
      return new Position(this.line, this.column + n);
    };

    return Position;
  })();

  var SourceLocation = function SourceLocation(p, start, end) {
    babelHelpers_classCallCheck(this, SourceLocation);

    this.start = start;
    this.end = end;
    if (p.sourceFile !== null) this.source = p.sourceFile;
  }

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  ;

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreakG.lastIndex = cur;
      var match = lineBreakG.exec(input);
      if (match && match.index < offset) {
        ++line;
        cur = match.index + match[0].length;
      } else {
        return new Position(line, offset - cur);
      }
    }
  }

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3, or 5, or 6. This influences support for strict
    // mode, the set of reserved words, support for getters and
    // setters and other features.
    ecmaVersion: 5,
    // Source type ("script" or "module") for different semantics
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called
    // when a semicolon is automatically inserted. It will be passed
    // th position of the comma as an offset, and if `locations` is
    // enabled, it is given the location as a `{line, column}` object
    // as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are not enforced. Disable
    // `allowReserved` to enforce them. When this option has the
    // value "never", reserved words and keywords can also not be
    // used as property names.
    allowReserved: true,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program.
    allowImportExportEverywhere: false,
    // When enabled, hashbang directive in the beginning of file
    // is allowed and treated as a line comment.
    allowHashBang: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokenize() returns. Note that you are not
    // allowed to call the parser from the callback—that will
    // corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false,
    plugins: {}
  };

  // Interpret and default an options object

  function getOptions(opts) {
    var options = {};
    for (var opt in defaultOptions) {
      options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt];
    }if (isArray$1(options.onToken)) {
      (function () {
        var tokens = options.onToken;
        options.onToken = function (token) {
          return tokens.push(token);
        };
      })();
    }
    if (isArray$1(options.onComment)) options.onComment = pushComment(options, options.onComment);

    return options;
  }

  function pushComment(options, array) {
    return function (block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? 'Block' : 'Line',
        value: text,
        start: start,
        end: end
      };
      if (options.locations) comment.loc = new SourceLocation(this, startLoc, endLoc);
      if (options.ranges) comment.range = [start, end];
      array.push(comment);
    };
  }

  // Registered plugins
  var plugins = {};

  var Parser = (function () {
    function Parser(options, input, startPos) {
      babelHelpers_classCallCheck(this, Parser);

      this.options = getOptions(options);
      this.sourceFile = this.options.sourceFile;
      this.isKeyword = keywords[this.options.ecmaVersion >= 6 ? 6 : 5];
      this.isReservedWord = reservedWords$1[this.options.ecmaVersion];
      this.input = String(input);

      // Used to signal to callers of `readWord1` whether the word
      // contained any escape sequences. This is needed because words with
      // escape sequences must not be interpreted as keywords.
      this.containsEsc = false;

      // Load plugins
      this.loadPlugins(this.options.plugins);

      // Set up token state

      // The current position of the tokenizer in the input.
      if (startPos) {
        this.pos = startPos;
        this.lineStart = Math.max(0, this.input.lastIndexOf("\n", startPos));
        this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
      } else {
        this.pos = this.lineStart = 0;
        this.curLine = 1;
      }

      // Properties of the current token:
      // Its type
      this.type = tt.eof;
      // For tokens that include more information than their type, the value
      this.value = null;
      // Its start and end offset
      this.start = this.end = this.pos;
      // And, if locations are used, the {line, column} object
      // corresponding to those offsets
      this.startLoc = this.endLoc = this.curPosition();

      // Position information for the previous token
      this.lastTokEndLoc = this.lastTokStartLoc = null;
      this.lastTokStart = this.lastTokEnd = this.pos;

      // The context stack is used to superficially track syntactic
      // context to predict whether a regular expression is allowed in a
      // given position.
      this.context = this.initialContext();
      this.exprAllowed = true;

      // Figure out if it's a module code.
      this.strict = this.inModule = this.options.sourceType === "module";

      // Used to signify the start of a potential arrow function
      this.potentialArrowAt = -1;

      // Flags to track whether we are in a function, a generator.
      this.inFunction = this.inGenerator = false;
      // Labels in scope.
      this.labels = [];

      // If enabled, skip leading hashbang line.
      if (this.pos === 0 && this.options.allowHashBang && this.input.slice(0, 2) === '#!') this.skipLineComment(2);
    }

    Parser.prototype.extend = function extend(name, f) {
      this[name] = f(this[name]);
    };

    Parser.prototype.loadPlugins = function loadPlugins(pluginConfigs) {
      for (var _name in pluginConfigs) {
        var plugin = plugins[_name];
        if (!plugin) throw new Error("Plugin '" + _name + "' not found");
        plugin(this, pluginConfigs[_name]);
      }
    };

    Parser.prototype.parse = function parse() {
      var node = this.options.program || this.startNode();
      this.nextToken();
      return this.parseTopLevel(node);
    };

    return Parser;
  })();

  var pp = Parser.prototype;

  // ## Parser utilities

  // Test whether a statement node is the string literal `"use strict"`.

  pp.isUseStrict = function (stmt) {
    return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && stmt.expression.raw.slice(1, -1) === "use strict";
  };

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp.eat = function (type) {
    if (this.type === type) {
      this.next();
      return true;
    } else {
      return false;
    }
  };

  // Tests whether parsed token is a contextual keyword.

  pp.isContextual = function (name) {
    return this.type === tt.name && this.value === name;
  };

  // Consumes contextual keyword if possible.

  pp.eatContextual = function (name) {
    return this.value === name && this.eat(tt.name);
  };

  // Asserts that following token is given contextual keyword.

  pp.expectContextual = function (name) {
    if (!this.eatContextual(name)) this.unexpected();
  };

  // Test whether a semicolon can be inserted at the current position.

  pp.canInsertSemicolon = function () {
    return this.type === tt.eof || this.type === tt.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
  };

  pp.insertSemicolon = function () {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon) this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
      return true;
    }
  };

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp.semicolon = function () {
    if (!this.eat(tt.semi) && !this.insertSemicolon()) this.unexpected();
  };

  pp.afterTrailingComma = function (tokType) {
    if (this.type == tokType) {
      if (this.options.onTrailingComma) this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
      this.next();
      return true;
    }
  };

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp.expect = function (type) {
    this.eat(type) || this.unexpected();
  };

  // Raise an unexpected token error.

  pp.unexpected = function (pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token");
  };

  var pp$1 = Parser.prototype;

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$1.parseTopLevel = function (node) {
    var first = true;
    if (!node.body) node.body = [];
    while (this.type !== tt.eof) {
      var stmt = this.parseStatement(true, true);
      node.body.push(stmt);
      if (first) {
        if (this.isUseStrict(stmt)) this.setStrict(true);
        first = false;
      }
    }
    this.next();
    if (this.options.ecmaVersion >= 6) {
      node.sourceType = this.options.sourceType;
    }
    return this.finishNode(node, "Program");
  };

  var loopLabel = { kind: "loop" };
  var switchLabel = { kind: "switch" };
  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$1.parseStatement = function (declaration, topLevel) {
    var starttype = this.type,
        node = this.startNode();

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
      case tt._break:case tt._continue:
        return this.parseBreakContinueStatement(node, starttype.keyword);
      case tt._debugger:
        return this.parseDebuggerStatement(node);
      case tt._do:
        return this.parseDoStatement(node);
      case tt._for:
        return this.parseForStatement(node);
      case tt._function:
        if (!declaration && this.options.ecmaVersion >= 6) this.unexpected();
        return this.parseFunctionStatement(node);
      case tt._class:
        if (!declaration) this.unexpected();
        return this.parseClass(node, true);
      case tt._if:
        return this.parseIfStatement(node);
      case tt._return:
        return this.parseReturnStatement(node);
      case tt._switch:
        return this.parseSwitchStatement(node);
      case tt._throw:
        return this.parseThrowStatement(node);
      case tt._try:
        return this.parseTryStatement(node);
      case tt._let:case tt._const:
        if (!declaration) this.unexpected(); // NOTE: falls through to _var
      case tt._var:
        return this.parseVarStatement(node, starttype);
      case tt._while:
        return this.parseWhileStatement(node);
      case tt._with:
        return this.parseWithStatement(node);
      case tt.braceL:
        return this.parseBlock();
      case tt.semi:
        return this.parseEmptyStatement(node);
      case tt._export:
      case tt._import:
        if (!this.options.allowImportExportEverywhere) {
          if (!topLevel) this.raise(this.start, "'import' and 'export' may only appear at the top level");
          if (!this.inModule) this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
        }
        return starttype === tt._import ? this.parseImport(node) : this.parseExport(node);

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
      default:
        var maybeName = this.value,
            expr = this.parseExpression();
        if (starttype === tt.name && expr.type === "Identifier" && this.eat(tt.colon)) return this.parseLabeledStatement(node, maybeName, expr);else return this.parseExpressionStatement(node, expr);
    }
  };

  pp$1.parseBreakContinueStatement = function (node, keyword) {
    var isBreak = keyword == "break";
    this.next();
    if (this.eat(tt.semi) || this.insertSemicolon()) node.label = null;else if (this.type !== tt.name) this.unexpected();else {
      node.label = this.parseIdent();
      this.semicolon();
    }

    // Verify that there is an actual destination to break or
    // continue to.
    for (var i = 0; i < this.labels.length; ++i) {
      var lab = this.labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
        if (node.label && isBreak) break;
      }
    }
    if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword);
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
  };

  pp$1.parseDebuggerStatement = function (node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement");
  };

  pp$1.parseDoStatement = function (node) {
    this.next();
    this.labels.push(loopLabel);
    node.body = this.parseStatement(false);
    this.labels.pop();
    this.expect(tt._while);
    node.test = this.parseParenExpression();
    if (this.options.ecmaVersion >= 6) this.eat(tt.semi);else this.semicolon();
    return this.finishNode(node, "DoWhileStatement");
  };

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$1.parseForStatement = function (node) {
    this.next();
    this.labels.push(loopLabel);
    this.expect(tt.parenL);
    if (this.type === tt.semi) return this.parseFor(node, null);
    if (this.type === tt._var || this.type === tt._let || this.type === tt._const) {
      var _init = this.startNode(),
          varKind = this.type;
      this.next();
      this.parseVar(_init, true, varKind);
      this.finishNode(_init, "VariableDeclaration");
      if ((this.type === tt._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && _init.declarations.length === 1 && !(varKind !== tt._var && _init.declarations[0].init)) return this.parseForIn(node, _init);
      return this.parseFor(node, _init);
    }
    var refShorthandDefaultPos = { start: 0 };
    var init = this.parseExpression(true, refShorthandDefaultPos);
    if (this.type === tt._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) {
      this.toAssignable(init);
      this.checkLVal(init);
      return this.parseForIn(node, init);
    } else if (refShorthandDefaultPos.start) {
      this.unexpected(refShorthandDefaultPos.start);
    }
    return this.parseFor(node, init);
  };

  pp$1.parseFunctionStatement = function (node) {
    this.next();
    return this.parseFunction(node, true);
  };

  pp$1.parseIfStatement = function (node) {
    this.next();
    node.test = this.parseParenExpression();
    node.consequent = this.parseStatement(false);
    node.alternate = this.eat(tt._else) ? this.parseStatement(false) : null;
    return this.finishNode(node, "IfStatement");
  };

  pp$1.parseReturnStatement = function (node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction) this.raise(this.start, "'return' outside of function");
    this.next();

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(tt.semi) || this.insertSemicolon()) node.argument = null;else {
      node.argument = this.parseExpression();this.semicolon();
    }
    return this.finishNode(node, "ReturnStatement");
  };

  pp$1.parseSwitchStatement = function (node) {
    this.next();
    node.discriminant = this.parseParenExpression();
    node.cases = [];
    this.expect(tt.braceL);
    this.labels.push(switchLabel);

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    for (var cur, sawDefault = false; this.type != tt.braceR;) {
      if (this.type === tt._case || this.type === tt._default) {
        var isCase = this.type === tt._case;
        if (cur) this.finishNode(cur, "SwitchCase");
        node.cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) this.raise(this.lastTokStart, "Multiple default clauses");
          sawDefault = true;
          cur.test = null;
        }
        this.expect(tt.colon);
      } else {
        if (!cur) this.unexpected();
        cur.consequent.push(this.parseStatement(true));
      }
    }
    if (cur) this.finishNode(cur, "SwitchCase");
    this.next(); // Closing brace
    this.labels.pop();
    return this.finishNode(node, "SwitchStatement");
  };

  pp$1.parseThrowStatement = function (node) {
    this.next();
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) this.raise(this.lastTokEnd, "Illegal newline after throw");
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement");
  };

  // Reused empty array added for node fields that are always empty.

  var empty = [];

  pp$1.parseTryStatement = function (node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.type === tt._catch) {
      var clause = this.startNode();
      this.next();
      this.expect(tt.parenL);
      clause.param = this.parseBindingAtom();
      this.checkLVal(clause.param, true);
      this.expect(tt.parenR);
      clause.guard = null;
      clause.body = this.parseBlock();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.guardedHandlers = empty;
    node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer) this.raise(node.start, "Missing catch or finally clause");
    return this.finishNode(node, "TryStatement");
  };

  pp$1.parseVarStatement = function (node, kind) {
    this.next();
    this.parseVar(node, false, kind);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration");
  };

  pp$1.parseWhileStatement = function (node) {
    this.next();
    node.test = this.parseParenExpression();
    this.labels.push(loopLabel);
    node.body = this.parseStatement(false);
    this.labels.pop();
    return this.finishNode(node, "WhileStatement");
  };

  pp$1.parseWithStatement = function (node) {
    if (this.strict) this.raise(this.start, "'with' in strict mode");
    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement(false);
    return this.finishNode(node, "WithStatement");
  };

  pp$1.parseEmptyStatement = function (node) {
    this.next();
    return this.finishNode(node, "EmptyStatement");
  };

  pp$1.parseLabeledStatement = function (node, maybeName, expr) {
    for (var i = 0; i < this.labels.length; ++i) {
      if (this.labels[i].name === maybeName) this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }var kind = this.type.isLoop ? "loop" : this.type === tt._switch ? "switch" : null;
    for (var i = this.labels.length - 1; i >= 0; i--) {
      var label = this.labels[i];
      if (label.statementStart == node.start) {
        label.statementStart = this.start;
        label.kind = kind;
      } else break;
    }
    this.labels.push({ name: maybeName, kind: kind, statementStart: this.start });
    node.body = this.parseStatement(true);
    this.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement");
  };

  pp$1.parseExpressionStatement = function (node, expr) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement");
  };

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$1.parseBlock = function (allowStrict) {
    var node = this.startNode(),
        first = true,
        oldStrict = undefined;
    node.body = [];
    this.expect(tt.braceL);
    while (!this.eat(tt.braceR)) {
      var stmt = this.parseStatement(true);
      node.body.push(stmt);
      if (first && allowStrict && this.isUseStrict(stmt)) {
        oldStrict = this.strict;
        this.setStrict(this.strict = true);
      }
      first = false;
    }
    if (oldStrict === false) this.setStrict(false);
    return this.finishNode(node, "BlockStatement");
  };

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$1.parseFor = function (node, init) {
    node.init = init;
    this.expect(tt.semi);
    node.test = this.type === tt.semi ? null : this.parseExpression();
    this.expect(tt.semi);
    node.update = this.type === tt.parenR ? null : this.parseExpression();
    this.expect(tt.parenR);
    node.body = this.parseStatement(false);
    this.labels.pop();
    return this.finishNode(node, "ForStatement");
  };

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$1.parseForIn = function (node, init) {
    var type = this.type === tt._in ? "ForInStatement" : "ForOfStatement";
    this.next();
    node.left = init;
    node.right = this.parseExpression();
    this.expect(tt.parenR);
    node.body = this.parseStatement(false);
    this.labels.pop();
    return this.finishNode(node, type);
  };

  // Parse a list of variable declarations.

  pp$1.parseVar = function (node, isFor, kind) {
    node.declarations = [];
    node.kind = kind.keyword;
    for (;;) {
      var decl = this.startNode();
      this.parseVarId(decl);
      if (this.eat(tt.eq)) {
        decl.init = this.parseMaybeAssign(isFor);
      } else if (kind === tt._const && !(this.type === tt._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
        this.unexpected();
      } else if (decl.id.type != "Identifier" && !(isFor && (this.type === tt._in || this.isContextual("of")))) {
        this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
      } else {
        decl.init = null;
      }
      node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(tt.comma)) break;
    }
    return node;
  };

  pp$1.parseVarId = function (decl) {
    decl.id = this.parseBindingAtom();
    this.checkLVal(decl.id, true);
  };

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseFunction = function (node, isStatement, allowExpressionBody) {
    this.initFunction(node);
    if (this.options.ecmaVersion >= 6) node.generator = this.eat(tt.star);
    if (isStatement || this.type === tt.name) node.id = this.parseIdent();
    this.parseFunctionParams(node);
    this.parseFunctionBody(node, allowExpressionBody);
    return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
  };

  pp$1.parseFunctionParams = function (node) {
    this.expect(tt.parenL);
    node.params = this.parseBindingList(tt.parenR, false, false);
  };

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseClass = function (node, isStatement) {
    this.next();
    this.parseClassId(node, isStatement);
    this.parseClassSuper(node);
    var classBody = this.startNode();
    var hadConstructor = false;
    classBody.body = [];
    this.expect(tt.braceL);
    while (!this.eat(tt.braceR)) {
      if (this.eat(tt.semi)) continue;
      var method = this.startNode();
      var isGenerator = this.eat(tt.star);
      var isMaybeStatic = this.type === tt.name && this.value === "static";
      this.parsePropertyName(method);
      method.static = isMaybeStatic && this.type !== tt.parenL;
      if (method.static) {
        if (isGenerator) this.unexpected();
        isGenerator = this.eat(tt.star);
        this.parsePropertyName(method);
      }
      method.kind = "method";
      var isGetSet = false;
      if (!method.computed) {
        var key = method.key;

        if (!isGenerator && key.type === "Identifier" && this.type !== tt.parenL && (key.name === "get" || key.name === "set")) {
          isGetSet = true;
          method.kind = key.name;
          key = this.parsePropertyName(method);
        }
        if (!method.static && (key.type === "Identifier" && key.name === "constructor" || key.type === "Literal" && key.value === "constructor")) {
          if (hadConstructor) this.raise(key.start, "Duplicate constructor in the same class");
          if (isGetSet) this.raise(key.start, "Constructor can't have get/set modifier");
          if (isGenerator) this.raise(key.start, "Constructor can't be a generator");
          method.kind = "constructor";
          hadConstructor = true;
        }
      }
      this.parseClassMethod(classBody, method, isGenerator);
      if (isGetSet) {
        var paramCount = method.kind === "get" ? 0 : 1;
        if (method.value.params.length !== paramCount) {
          var start = method.value.start;
          if (method.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
        }
      }
    }
    node.body = this.finishNode(classBody, "ClassBody");
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
  };

  pp$1.parseClassMethod = function (classBody, method, isGenerator) {
    method.value = this.parseMethod(isGenerator);
    classBody.body.push(this.finishNode(method, "MethodDefinition"));
  };

  pp$1.parseClassId = function (node, isStatement) {
    node.id = this.type === tt.name ? this.parseIdent() : isStatement ? this.unexpected() : null;
  };

  pp$1.parseClassSuper = function (node) {
    node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null;
  };

  // Parses module export declaration.

  pp$1.parseExport = function (node) {
    this.next();
    // export * from '...'
    if (this.eat(tt.star)) {
      this.expectContextual("from");
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected();
      this.semicolon();
      return this.finishNode(node, "ExportAllDeclaration");
    }
    if (this.eat(tt._default)) {
      // export default ...
      var expr = this.parseMaybeAssign();
      var needsSemi = true;
      if (expr.type == "FunctionExpression" || expr.type == "ClassExpression") {
        needsSemi = false;
        if (expr.id) {
          expr.type = expr.type == "FunctionExpression" ? "FunctionDeclaration" : "ClassDeclaration";
        }
      }
      node.declaration = expr;
      if (needsSemi) this.semicolon();
      return this.finishNode(node, "ExportDefaultDeclaration");
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseStatement(true);
      node.specifiers = [];
      node.source = null;
    } else {
      // export { x, y as z } [from '...']
      node.declaration = null;
      node.specifiers = this.parseExportSpecifiers();
      if (this.eatContextual("from")) {
        node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected();
      } else {
        node.source = null;
      }
      this.semicolon();
    }
    return this.finishNode(node, "ExportNamedDeclaration");
  };

  pp$1.shouldParseExportStatement = function () {
    return this.type.keyword;
  };

  // Parses a comma-separated list of module exports.

  pp$1.parseExportSpecifiers = function () {
    var nodes = [],
        first = true;
    // export { x, y as z } [from '...']
    this.expect(tt.braceL);
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this.expect(tt.comma);
        if (this.afterTrailingComma(tt.braceR)) break;
      } else first = false;

      var node = this.startNode();
      node.local = this.parseIdent(this.type === tt._default);
      node.exported = this.eatContextual("as") ? this.parseIdent(true) : node.local;
      nodes.push(this.finishNode(node, "ExportSpecifier"));
    }
    return nodes;
  };

  // Parses import declaration.

  pp$1.parseImport = function (node) {
    this.next();
    // import '...'
    if (this.type === tt.string) {
      node.specifiers = empty;
      node.source = this.parseExprAtom();
    } else {
      node.specifiers = this.parseImportSpecifiers();
      this.expectContextual("from");
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected();
    }
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration");
  };

  // Parses a comma-separated list of module imports.

  pp$1.parseImportSpecifiers = function () {
    var nodes = [],
        first = true;
    if (this.type === tt.name) {
      // import defaultObj, { x, y as z } from '...'
      var node = this.startNode();
      node.local = this.parseIdent();
      this.checkLVal(node.local, true);
      nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
      if (!this.eat(tt.comma)) return nodes;
    }
    if (this.type === tt.star) {
      var node = this.startNode();
      this.next();
      this.expectContextual("as");
      node.local = this.parseIdent();
      this.checkLVal(node.local, true);
      nodes.push(this.finishNode(node, "ImportNamespaceSpecifier"));
      return nodes;
    }
    this.expect(tt.braceL);
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this.expect(tt.comma);
        if (this.afterTrailingComma(tt.braceR)) break;
      } else first = false;

      var node = this.startNode();
      node.imported = this.parseIdent(true);
      node.local = this.eatContextual("as") ? this.parseIdent() : node.imported;
      this.checkLVal(node.local, true);
      nodes.push(this.finishNode(node, "ImportSpecifier"));
    }
    return nodes;
  };

  var pp$2 = Parser.prototype;

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$2.toAssignable = function (node, isBinding) {
    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
        case "Identifier":
        case "ObjectPattern":
        case "ArrayPattern":
        case "AssignmentPattern":
          break;

        case "ObjectExpression":
          node.type = "ObjectPattern";
          for (var i = 0; i < node.properties.length; i++) {
            var prop = node.properties[i];
            if (prop.kind !== "init") this.raise(prop.key.start, "Object pattern can't contain getter or setter");
            this.toAssignable(prop.value, isBinding);
          }
          break;

        case "ArrayExpression":
          node.type = "ArrayPattern";
          this.toAssignableList(node.elements, isBinding);
          break;

        case "AssignmentExpression":
          if (node.operator === "=") {
            node.type = "AssignmentPattern";
            delete node.operator;
          } else {
            this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
          }
          break;

        case "ParenthesizedExpression":
          node.expression = this.toAssignable(node.expression, isBinding);
          break;

        case "MemberExpression":
          if (!isBinding) break;

        default:
          this.raise(node.start, "Assigning to rvalue");
      }
    }
    return node;
  };

  // Convert list of expression atoms to binding list.

  pp$2.toAssignableList = function (exprList, isBinding) {
    var end = exprList.length;
    if (end) {
      var last = exprList[end - 1];
      if (last && last.type == "RestElement") {
        --end;
      } else if (last && last.type == "SpreadElement") {
        last.type = "RestElement";
        var arg = last.argument;
        this.toAssignable(arg, isBinding);
        if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern") this.unexpected(arg.start);
        --end;
      }
    }
    for (var i = 0; i < end; i++) {
      var elt = exprList[i];
      if (elt) this.toAssignable(elt, isBinding);
    }
    return exprList;
  };

  // Parses spread element.

  pp$2.parseSpread = function (refShorthandDefaultPos) {
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssign(refShorthandDefaultPos);
    return this.finishNode(node, "SpreadElement");
  };

  pp$2.parseRest = function () {
    var node = this.startNode();
    this.next();
    node.argument = this.type === tt.name || this.type === tt.bracketL ? this.parseBindingAtom() : this.unexpected();
    return this.finishNode(node, "RestElement");
  };

  // Parses lvalue (assignable) atom.

  pp$2.parseBindingAtom = function () {
    if (this.options.ecmaVersion < 6) return this.parseIdent();
    switch (this.type) {
      case tt.name:
        return this.parseIdent();

      case tt.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(tt.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern");

      case tt.braceL:
        return this.parseObj(true);

      default:
        this.unexpected();
    }
  };

  pp$2.parseBindingList = function (close, allowEmpty, allowTrailingComma) {
    var elts = [],
        first = true;
    while (!this.eat(close)) {
      if (first) first = false;else this.expect(tt.comma);
      if (allowEmpty && this.type === tt.comma) {
        elts.push(null);
      } else if (allowTrailingComma && this.afterTrailingComma(close)) {
        break;
      } else if (this.type === tt.ellipsis) {
        var rest = this.parseRest();
        this.parseBindingListItem(rest);
        elts.push(rest);
        this.expect(close);
        break;
      } else {
        var elem = this.parseMaybeDefault(this.start, this.startLoc);
        this.parseBindingListItem(elem);
        elts.push(elem);
      }
    }
    return elts;
  };

  pp$2.parseBindingListItem = function (param) {
    return param;
  };

  // Parses assignment pattern around given atom if possible.

  pp$2.parseMaybeDefault = function (startPos, startLoc, left) {
    left = left || this.parseBindingAtom();
    if (this.options.ecmaVersion < 6 || !this.eat(tt.eq)) return left;
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.right = this.parseMaybeAssign();
    return this.finishNode(node, "AssignmentPattern");
  };

  // Verify that a node is an lval — something that can be assigned
  // to.

  pp$2.checkLVal = function (expr, isBinding, checkClashes) {
    switch (expr.type) {
      case "Identifier":
        if (this.strict && (reservedWords$1.strictBind(expr.name) || reservedWords$1.strict(expr.name))) this.raise(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
        if (checkClashes) {
          if (has(checkClashes, expr.name)) this.raise(expr.start, "Argument name clash in strict mode");
          checkClashes[expr.name] = true;
        }
        break;

      case "MemberExpression":
        if (isBinding) this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression");
        break;

      case "ObjectPattern":
        for (var i = 0; i < expr.properties.length; i++) {
          this.checkLVal(expr.properties[i].value, isBinding, checkClashes);
        }break;

      case "ArrayPattern":
        for (var i = 0; i < expr.elements.length; i++) {
          var elem = expr.elements[i];
          if (elem) this.checkLVal(elem, isBinding, checkClashes);
        }
        break;

      case "AssignmentPattern":
        this.checkLVal(expr.left, isBinding, checkClashes);
        break;

      case "RestElement":
        this.checkLVal(expr.argument, isBinding, checkClashes);
        break;

      case "ParenthesizedExpression":
        this.checkLVal(expr.expression, isBinding, checkClashes);
        break;

      default:
        this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue");
    }
  };

  var pp$3 = Parser.prototype;

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$3.checkPropClash = function (prop, propHash) {
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) return;
    var key = prop.key,
        name = undefined;
    switch (key.type) {
      case "Identifier":
        name = key.name;break;
      case "Literal":
        name = String(key.value);break;
      default:
        return;
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) this.raise(key.start, "Redefinition of __proto__ property");
        propHash.proto = true;
      }
      return;
    }
    var other = undefined;
    if (has(propHash, name)) {
      other = propHash[name];
      var isGetSet = kind !== "init";
      if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init)) this.raise(key.start, "Redefinition of property");
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      };
    }
    other[kind] = true;
  };

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$3.parseExpression = function (noIn, refShorthandDefaultPos) {
    var startPos = this.start,
        startLoc = this.startLoc;
    var expr = this.parseMaybeAssign(noIn, refShorthandDefaultPos);
    if (this.type === tt.comma) {
      var node = this.startNodeAt(startPos, startLoc);
      node.expressions = [expr];
      while (this.eat(tt.comma)) node.expressions.push(this.parseMaybeAssign(noIn, refShorthandDefaultPos));
      return this.finishNode(node, "SequenceExpression");
    }
    return expr;
  };

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$3.parseMaybeAssign = function (noIn, refShorthandDefaultPos, afterLeftParse) {
    if (this.type == tt._yield && this.inGenerator) return this.parseYield();

    var failOnShorthandAssign = undefined;
    if (!refShorthandDefaultPos) {
      refShorthandDefaultPos = { start: 0 };
      failOnShorthandAssign = true;
    } else {
      failOnShorthandAssign = false;
    }
    var startPos = this.start,
        startLoc = this.startLoc;
    if (this.type == tt.parenL || this.type == tt.name) this.potentialArrowAt = this.start;
    var left = this.parseMaybeConditional(noIn, refShorthandDefaultPos);
    if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc);
    if (this.type.isAssign) {
      var node = this.startNodeAt(startPos, startLoc);
      node.operator = this.value;
      node.left = this.type === tt.eq ? this.toAssignable(left) : left;
      refShorthandDefaultPos.start = 0; // reset because shorthand default was used correctly
      this.checkLVal(left);
      this.next();
      node.right = this.parseMaybeAssign(noIn);
      return this.finishNode(node, "AssignmentExpression");
    } else if (failOnShorthandAssign && refShorthandDefaultPos.start) {
      this.unexpected(refShorthandDefaultPos.start);
    }
    return left;
  };

  // Parse a ternary conditional (`?:`) operator.

  pp$3.parseMaybeConditional = function (noIn, refShorthandDefaultPos) {
    var startPos = this.start,
        startLoc = this.startLoc;
    var expr = this.parseExprOps(noIn, refShorthandDefaultPos);
    if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
    if (this.eat(tt.question)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssign();
      this.expect(tt.colon);
      node.alternate = this.parseMaybeAssign(noIn);
      return this.finishNode(node, "ConditionalExpression");
    }
    return expr;
  };

  // Start the precedence parser.

  pp$3.parseExprOps = function (noIn, refShorthandDefaultPos) {
    var startPos = this.start,
        startLoc = this.startLoc;
    var expr = this.parseMaybeUnary(refShorthandDefaultPos);
    if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
    return this.parseExprOp(expr, startPos, startLoc, -1, noIn);
  };

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$3.parseExprOp = function (left, leftStartPos, leftStartLoc, minPrec, noIn) {
    var prec = this.type.binop;
    if (prec != null && (!noIn || this.type !== tt._in)) {
      if (prec > minPrec) {
        var node = this.startNodeAt(leftStartPos, leftStartLoc);
        node.left = left;
        node.operator = this.value;
        var op = this.type;
        this.next();
        var startPos = this.start,
            startLoc = this.startLoc;
        node.right = this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, prec, noIn);
        this.finishNode(node, op === tt.logicalOR || op === tt.logicalAND ? "LogicalExpression" : "BinaryExpression");
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn);
      }
    }
    return left;
  };

  // Parse unary operators, both prefix and postfix.

  pp$3.parseMaybeUnary = function (refShorthandDefaultPos) {
    if (this.type.prefix) {
      var node = this.startNode(),
          update = this.type === tt.incDec;
      node.operator = this.value;
      node.prefix = true;
      this.next();
      node.argument = this.parseMaybeUnary();
      if (refShorthandDefaultPos && refShorthandDefaultPos.start) this.unexpected(refShorthandDefaultPos.start);
      if (update) this.checkLVal(node.argument);else if (this.strict && node.operator === "delete" && node.argument.type === "Identifier") this.raise(node.start, "Deleting local variable in strict mode");
      return this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    }
    var startPos = this.start,
        startLoc = this.startLoc;
    var expr = this.parseExprSubscripts(refShorthandDefaultPos);
    if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node = this.startNodeAt(startPos, startLoc);
      node.operator = this.value;
      node.prefix = false;
      node.argument = expr;
      this.checkLVal(expr);
      this.next();
      expr = this.finishNode(node, "UpdateExpression");
    }
    return expr;
  };

  // Parse call, dot, and `[]`-subscript expressions.

  pp$3.parseExprSubscripts = function (refShorthandDefaultPos) {
    var startPos = this.start,
        startLoc = this.startLoc;
    var expr = this.parseExprAtom(refShorthandDefaultPos);
    if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
    return this.parseSubscripts(expr, startPos, startLoc);
  };

  pp$3.parseSubscripts = function (base, startPos, startLoc, noCalls) {
    for (;;) {
      if (this.eat(tt.dot)) {
        var node = this.startNodeAt(startPos, startLoc);
        node.object = base;
        node.property = this.parseIdent(true);
        node.computed = false;
        base = this.finishNode(node, "MemberExpression");
      } else if (this.eat(tt.bracketL)) {
        var node = this.startNodeAt(startPos, startLoc);
        node.object = base;
        node.property = this.parseExpression();
        node.computed = true;
        this.expect(tt.bracketR);
        base = this.finishNode(node, "MemberExpression");
      } else if (!noCalls && this.eat(tt.parenL)) {
        var node = this.startNodeAt(startPos, startLoc);
        node.callee = base;
        node.arguments = this.parseExprList(tt.parenR, false);
        base = this.finishNode(node, "CallExpression");
      } else if (this.type === tt.backQuote) {
        var node = this.startNodeAt(startPos, startLoc);
        node.tag = base;
        node.quasi = this.parseTemplate();
        base = this.finishNode(node, "TaggedTemplateExpression");
      } else {
        return base;
      }
    }
  };

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$3.parseExprAtom = function (refShorthandDefaultPos) {
    var node = undefined,
        canBeArrow = this.potentialArrowAt == this.start;
    switch (this.type) {
      case tt._super:
        if (!this.inFunction) this.raise(this.start, "'super' outside of function or class");
      case tt._this:
        var type = this.type === tt._this ? "ThisExpression" : "Super";
        node = this.startNode();
        this.next();
        return this.finishNode(node, type);

      case tt._yield:
        if (this.inGenerator) this.unexpected();

      case tt.name:
        var startPos = this.start,
            startLoc = this.startLoc;
        var id = this.parseIdent(this.type !== tt.name);
        if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id]);
        return id;

      case tt.regexp:
        var value = this.value;
        node = this.parseLiteral(value.value);
        node.regex = { pattern: value.pattern, flags: value.flags };
        return node;

      case tt.num:case tt.string:
        return this.parseLiteral(this.value);

      case tt._null:case tt._true:case tt._false:
        node = this.startNode();
        node.value = this.type === tt._null ? null : this.type === tt._true;
        node.raw = this.type.keyword;
        this.next();
        return this.finishNode(node, "Literal");

      case tt.parenL:
        return this.parseParenAndDistinguishExpression(canBeArrow);

      case tt.bracketL:
        node = this.startNode();
        this.next();
        // check whether this is array comprehension or regular array
        if (this.options.ecmaVersion >= 7 && this.type === tt._for) {
          return this.parseComprehension(node, false);
        }
        node.elements = this.parseExprList(tt.bracketR, true, true, refShorthandDefaultPos);
        return this.finishNode(node, "ArrayExpression");

      case tt.braceL:
        return this.parseObj(false, refShorthandDefaultPos);

      case tt._function:
        node = this.startNode();
        this.next();
        return this.parseFunction(node, false);

      case tt._class:
        return this.parseClass(this.startNode(), false);

      case tt._new:
        return this.parseNew();

      case tt.backQuote:
        return this.parseTemplate();

      default:
        this.unexpected();
    }
  };

  pp$3.parseLiteral = function (value) {
    var node = this.startNode();
    node.value = value;
    node.raw = this.input.slice(this.start, this.end);
    this.next();
    return this.finishNode(node, "Literal");
  };

  pp$3.parseParenExpression = function () {
    this.expect(tt.parenL);
    var val = this.parseExpression();
    this.expect(tt.parenR);
    return val;
  };

  pp$3.parseParenAndDistinguishExpression = function (canBeArrow) {
    var startPos = this.start,
        startLoc = this.startLoc,
        val = undefined;
    if (this.options.ecmaVersion >= 6) {
      this.next();

      if (this.options.ecmaVersion >= 7 && this.type === tt._for) {
        return this.parseComprehension(this.startNodeAt(startPos, startLoc), true);
      }

      var innerStartPos = this.start,
          innerStartLoc = this.startLoc;
      var exprList = [],
          first = true;
      var refShorthandDefaultPos = { start: 0 },
          spreadStart = undefined,
          innerParenStart = undefined;
      while (this.type !== tt.parenR) {
        first ? first = false : this.expect(tt.comma);
        if (this.type === tt.ellipsis) {
          spreadStart = this.start;
          exprList.push(this.parseParenItem(this.parseRest()));
          break;
        } else {
          if (this.type === tt.parenL && !innerParenStart) {
            innerParenStart = this.start;
          }
          exprList.push(this.parseMaybeAssign(false, refShorthandDefaultPos, this.parseParenItem));
        }
      }
      var innerEndPos = this.start,
          innerEndLoc = this.startLoc;
      this.expect(tt.parenR);

      if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) {
        if (innerParenStart) this.unexpected(innerParenStart);
        return this.parseParenArrowList(startPos, startLoc, exprList);
      }

      if (!exprList.length) this.unexpected(this.lastTokStart);
      if (spreadStart) this.unexpected(spreadStart);
      if (refShorthandDefaultPos.start) this.unexpected(refShorthandDefaultPos.start);

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc);
        val.expressions = exprList;
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
      } else {
        val = exprList[0];
      }
    } else {
      val = this.parseParenExpression();
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc);
      par.expression = val;
      return this.finishNode(par, "ParenthesizedExpression");
    } else {
      return val;
    }
  };

  pp$3.parseParenItem = function (item) {
    return item;
  };

  pp$3.parseParenArrowList = function (startPos, startLoc, exprList) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList);
  };

  // New's precedence is slightly tricky. It must allow its argument
  // to be a `[]` or dot subscript expression, but not a call — at
  // least, not without wrapping it in parentheses. Thus, it uses the

  var empty$1 = [];

  pp$3.parseNew = function () {
    var node = this.startNode();
    var meta = this.parseIdent(true);
    if (this.options.ecmaVersion >= 6 && this.eat(tt.dot)) {
      node.meta = meta;
      node.property = this.parseIdent(true);
      if (node.property.name !== "target") this.raise(node.property.start, "The only valid meta property for new is new.target");
      return this.finishNode(node, "MetaProperty");
    }
    var startPos = this.start,
        startLoc = this.startLoc;
    node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
    if (this.eat(tt.parenL)) node.arguments = this.parseExprList(tt.parenR, false);else node.arguments = empty$1;
    return this.finishNode(node, "NewExpression");
  };

  // Parse template expression.

  pp$3.parseTemplateElement = function () {
    var elem = this.startNode();
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
      cooked: this.value
    };
    this.next();
    elem.tail = this.type === tt.backQuote;
    return this.finishNode(elem, "TemplateElement");
  };

  pp$3.parseTemplate = function () {
    var node = this.startNode();
    this.next();
    node.expressions = [];
    var curElt = this.parseTemplateElement();
    node.quasis = [curElt];
    while (!curElt.tail) {
      this.expect(tt.dollarBraceL);
      node.expressions.push(this.parseExpression());
      this.expect(tt.braceR);
      node.quasis.push(curElt = this.parseTemplateElement());
    }
    this.next();
    return this.finishNode(node, "TemplateLiteral");
  };

  // Parse an object literal or binding pattern.

  pp$3.parseObj = function (isPattern, refShorthandDefaultPos) {
    var node = this.startNode(),
        first = true,
        propHash = {};
    node.properties = [];
    this.next();
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this.expect(tt.comma);
        if (this.afterTrailingComma(tt.braceR)) break;
      } else first = false;

      var prop = this.startNode(),
          isGenerator = undefined,
          startPos = undefined,
          startLoc = undefined;
      if (this.options.ecmaVersion >= 6) {
        prop.method = false;
        prop.shorthand = false;
        if (isPattern || refShorthandDefaultPos) {
          startPos = this.start;
          startLoc = this.startLoc;
        }
        if (!isPattern) isGenerator = this.eat(tt.star);
      }
      this.parsePropertyName(prop);
      this.parsePropertyValue(prop, isPattern, isGenerator, startPos, startLoc, refShorthandDefaultPos);
      this.checkPropClash(prop, propHash);
      node.properties.push(this.finishNode(prop, "Property"));
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
  };

  pp$3.parsePropertyValue = function (prop, isPattern, isGenerator, startPos, startLoc, refShorthandDefaultPos) {
    if (this.eat(tt.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refShorthandDefaultPos);
      prop.kind = "init";
    } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
      if (isPattern) this.unexpected();
      prop.kind = "init";
      prop.method = true;
      prop.value = this.parseMethod(isGenerator);
    } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.type != tt.comma && this.type != tt.braceR)) {
      if (isGenerator || isPattern) this.unexpected();
      prop.kind = prop.key.name;
      this.parsePropertyName(prop);
      prop.value = this.parseMethod(false);
      var paramCount = prop.kind === "get" ? 0 : 1;
      if (prop.value.params.length !== paramCount) {
        var start = prop.value.start;
        if (prop.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
      }
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      prop.kind = "init";
      if (isPattern) {
        if (this.isKeyword(prop.key.name) || this.strict && (reservedWords$1.strictBind(prop.key.name) || reservedWords$1.strict(prop.key.name)) || !this.options.allowReserved && this.isReservedWord(prop.key.name)) this.raise(prop.key.start, "Binding " + prop.key.name);
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
      } else if (this.type === tt.eq && refShorthandDefaultPos) {
        if (!refShorthandDefaultPos.start) refShorthandDefaultPos.start = this.start;
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
      } else {
        prop.value = prop.key;
      }
      prop.shorthand = true;
    } else this.unexpected();
  };

  pp$3.parsePropertyName = function (prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(tt.bracketL)) {
        prop.computed = true;
        prop.key = this.parseMaybeAssign();
        this.expect(tt.bracketR);
        return prop.key;
      } else {
        prop.computed = false;
      }
    }
    return prop.key = this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true);
  };

  // Initialize empty function node.

  pp$3.initFunction = function (node) {
    node.id = null;
    if (this.options.ecmaVersion >= 6) {
      node.generator = false;
      node.expression = false;
    }
  };

  // Parse object or class method.

  pp$3.parseMethod = function (isGenerator) {
    var node = this.startNode();
    this.initFunction(node);
    this.expect(tt.parenL);
    node.params = this.parseBindingList(tt.parenR, false, false);
    var allowExpressionBody = undefined;
    if (this.options.ecmaVersion >= 6) {
      node.generator = isGenerator;
    }
    this.parseFunctionBody(node, false);
    return this.finishNode(node, "FunctionExpression");
  };

  // Parse arrow function expression with given parameters.

  pp$3.parseArrowExpression = function (node, params) {
    this.initFunction(node);
    node.params = this.toAssignableList(params, true);
    this.parseFunctionBody(node, true);
    return this.finishNode(node, "ArrowFunctionExpression");
  };

  // Parse function body and check parameters.

  pp$3.parseFunctionBody = function (node, allowExpression) {
    var isExpression = allowExpression && this.type !== tt.braceL;

    if (isExpression) {
      node.body = this.parseMaybeAssign();
      node.expression = true;
    } else {
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldInFunc = this.inFunction,
          oldInGen = this.inGenerator,
          oldLabels = this.labels;
      this.inFunction = true;this.inGenerator = node.generator;this.labels = [];
      node.body = this.parseBlock(true);
      node.expression = false;
      this.inFunction = oldInFunc;this.inGenerator = oldInGen;this.labels = oldLabels;
    }

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    if (this.strict || !isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) {
      var nameHash = {},
          oldStrict = this.strict;
      this.strict = true;
      if (node.id) this.checkLVal(node.id, true);
      for (var i = 0; i < node.params.length; i++) {
        this.checkLVal(node.params[i], true, nameHash);
      }this.strict = oldStrict;
    }
  };

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$3.parseExprList = function (close, allowTrailingComma, allowEmpty, refShorthandDefaultPos) {
    var elts = [],
        first = true;
    while (!this.eat(close)) {
      if (!first) {
        this.expect(tt.comma);
        if (allowTrailingComma && this.afterTrailingComma(close)) break;
      } else first = false;

      var elt = undefined;
      if (allowEmpty && this.type === tt.comma) elt = null;else if (this.type === tt.ellipsis) elt = this.parseSpread(refShorthandDefaultPos);else elt = this.parseMaybeAssign(false, refShorthandDefaultPos);
      elts.push(elt);
    }
    return elts;
  };

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$3.parseIdent = function (liberal) {
    var node = this.startNode();
    if (liberal && this.options.allowReserved == "never") liberal = false;
    if (this.type === tt.name) {
      if (!liberal && (!this.options.allowReserved && this.isReservedWord(this.value) || this.strict && reservedWords$1.strict(this.value) && (this.options.ecmaVersion >= 6 || this.input.slice(this.start, this.end).indexOf("\\") == -1))) this.raise(this.start, "The keyword '" + this.value + "' is reserved");
      node.name = this.value;
    } else if (liberal && this.type.keyword) {
      node.name = this.type.keyword;
    } else {
      this.unexpected();
    }
    this.next();
    return this.finishNode(node, "Identifier");
  };

  // Parses yield expression inside generator.

  pp$3.parseYield = function () {
    var node = this.startNode();
    this.next();
    if (this.type == tt.semi || this.canInsertSemicolon() || this.type != tt.star && !this.type.startsExpr) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(tt.star);
      node.argument = this.parseMaybeAssign();
    }
    return this.finishNode(node, "YieldExpression");
  };

  // Parses array and generator comprehensions.

  pp$3.parseComprehension = function (node, isGenerator) {
    node.blocks = [];
    while (this.type === tt._for) {
      var block = this.startNode();
      this.next();
      this.expect(tt.parenL);
      block.left = this.parseBindingAtom();
      this.checkLVal(block.left, true);
      this.expectContextual("of");
      block.right = this.parseExpression();
      this.expect(tt.parenR);
      node.blocks.push(this.finishNode(block, "ComprehensionBlock"));
    }
    node.filter = this.eat(tt._if) ? this.parseParenExpression() : null;
    node.body = this.parseExpression();
    this.expect(isGenerator ? tt.parenR : tt.bracketR);
    node.generator = isGenerator;
    return this.finishNode(node, "ComprehensionExpression");
  };

  var pp$4 = Parser.prototype;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function (pos, message) {
    var loc = getLineInfo(this.input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    var err = new SyntaxError(message);
    err.pos = pos;err.loc = loc;err.raisedAt = this.pos;
    throw err;
  };

  pp$4.curPosition = function () {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart);
    }
  };

  var Node = function Node(parser, pos, loc) {
    babelHelpers_classCallCheck(this, Node);

    this.type = "";
    this.start = pos;
    this.end = 0;
    if (parser.options.locations) this.loc = new SourceLocation(parser, loc);
    if (parser.options.directSourceFile) this.sourceFile = parser.options.directSourceFile;
    if (parser.options.ranges) this.range = [pos, 0];
  }

  // Start an AST node, attaching a start offset.

  ;

  var pp$5 = Parser.prototype;

  pp$5.startNode = function () {
    return new Node(this, this.start, this.startLoc);
  };

  pp$5.startNodeAt = function (pos, loc) {
    return new Node(this, pos, loc);
  };

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type;
    node.end = pos;
    if (this.options.locations) node.loc.end = loc;
    if (this.options.ranges) node.range[1] = pos;
    return node;
  }

  pp$5.finishNode = function (node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
  };

  // Finish node at given position

  pp$5.finishNodeAt = function (node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc);
  };

  var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
    babelHelpers_classCallCheck(this, TokContext);

    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
  };

  var types = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", true),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) {
      return p.readTmplToken();
    }),
    f_expr: new TokContext("function", true)
  };

  var pp$6 = Parser.prototype;

  pp$6.initialContext = function () {
    return [types.b_stat];
  };

  pp$6.braceIsBlock = function (prevType) {
    if (prevType === tt.colon) {
      var _parent = this.curContext();
      if (_parent === types.b_stat || _parent === types.b_expr) return !_parent.isExpr;
    }
    if (prevType === tt._return) return lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
    if (prevType === tt._else || prevType === tt.semi || prevType === tt.eof || prevType === tt.parenR) return true;
    if (prevType == tt.braceL) return this.curContext() === types.b_stat;
    return !this.exprAllowed;
  };

  pp$6.updateContext = function (prevType) {
    var update = undefined,
        type = this.type;
    if (type.keyword && prevType == tt.dot) this.exprAllowed = false;else if (update = type.updateContext) update.call(this, prevType);else this.exprAllowed = type.beforeExpr;
  };

  // Token-specific context update code

  tt.parenR.updateContext = tt.braceR.updateContext = function () {
    if (this.context.length == 1) {
      this.exprAllowed = true;
      return;
    }
    var out = this.context.pop();
    if (out === types.b_stat && this.curContext() === types.f_expr) {
      this.context.pop();
      this.exprAllowed = false;
    } else if (out === types.b_tmpl) {
      this.exprAllowed = true;
    } else {
      this.exprAllowed = !out.isExpr;
    }
  };

  tt.braceL.updateContext = function (prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
    this.exprAllowed = true;
  };

  tt.dollarBraceL.updateContext = function () {
    this.context.push(types.b_tmpl);
    this.exprAllowed = true;
  };

  tt.parenL.updateContext = function (prevType) {
    var statementParens = prevType === tt._if || prevType === tt._for || prevType === tt._with || prevType === tt._while;
    this.context.push(statementParens ? types.p_stat : types.p_expr);
    this.exprAllowed = true;
  };

  tt.incDec.updateContext = function () {
    // tokExprAllowed stays unchanged
  };

  tt._function.updateContext = function () {
    if (this.curContext() !== types.b_stat) this.context.push(types.f_expr);
    this.exprAllowed = false;
  };

  tt.backQuote.updateContext = function () {
    if (this.curContext() === types.q_tmpl) this.context.pop();else this.context.push(types.q_tmpl);
    this.exprAllowed = false;
  };

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token = function Token(p) {
    babelHelpers_classCallCheck(this, Token);

    this.type = p.type;
    this.value = p.value;
    this.start = p.start;
    this.end = p.end;
    if (p.options.locations) this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
    if (p.options.ranges) this.range = [p.start, p.end];
  }

  // ## Tokenizer

  ;

  var pp$7 = Parser.prototype;

  // Are we running under Rhino?
  var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]";

  // Move to the next token

  pp$7.next = function () {
    if (this.options.onToken) this.options.onToken(new Token(this));

    this.lastTokEnd = this.end;
    this.lastTokStart = this.start;
    this.lastTokEndLoc = this.endLoc;
    this.lastTokStartLoc = this.startLoc;
    this.nextToken();
  };

  pp$7.getToken = function () {
    this.next();
    return new Token(this);
  };

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined") pp$7[Symbol.iterator] = function () {
    var self = this;
    return { next: function () {
        var token = self.getToken();
        return {
          done: token.type === tt.eof,
          value: token
        };
      } };
  };

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  pp$7.setStrict = function (strict) {
    this.strict = strict;
    if (this.type !== tt.num && this.type !== tt.string) return;
    this.pos = this.start;
    if (this.options.locations) {
      while (this.pos < this.lineStart) {
        this.lineStart = this.input.lastIndexOf("\n", this.lineStart - 2) + 1;
        --this.curLine;
      }
    }
    this.nextToken();
  };

  pp$7.curContext = function () {
    return this.context[this.context.length - 1];
  };

  // Read a single token, updating the parser object's token-related
  // properties.

  pp$7.nextToken = function () {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) this.skipSpace();

    this.start = this.pos;
    if (this.options.locations) this.startLoc = this.curPosition();
    if (this.pos >= this.input.length) return this.finishToken(tt.eof);

    if (curContext.override) return curContext.override(this);else this.readToken(this.fullCharCodeAtPos());
  };

  pp$7.readToken = function (code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */) return this.readWord();

    return this.getTokenFromCode(code);
  };

  pp$7.fullCharCodeAtPos = function () {
    var code = this.input.charCodeAt(this.pos);
    if (code <= 0xd7ff || code >= 0xe000) return code;
    var next = this.input.charCodeAt(this.pos + 1);
    return (code << 10) + next - 0x35fdc00;
  };

  pp$7.skipBlockComment = function () {
    var startLoc = this.options.onComment && this.curPosition();
    var start = this.pos,
        end = this.input.indexOf("*/", this.pos += 2);
    if (end === -1) this.raise(this.pos - 2, "Unterminated comment");
    this.pos = end + 2;
    if (this.options.locations) {
      lineBreakG.lastIndex = start;
      var match = undefined;
      while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
        ++this.curLine;
        this.lineStart = match.index + match[0].length;
      }
    }
    if (this.options.onComment) this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos, startLoc, this.curPosition());
  };

  pp$7.skipLineComment = function (startSkip) {
    var start = this.pos;
    var startLoc = this.options.onComment && this.curPosition();
    var ch = this.input.charCodeAt(this.pos += startSkip);
    while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++this.pos;
      ch = this.input.charCodeAt(this.pos);
    }
    if (this.options.onComment) this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos, startLoc, this.curPosition());
  };

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp$7.skipSpace = function () {
    loop: while (this.pos < this.input.length) {
      var ch = this.input.charCodeAt(this.pos);
      switch (ch) {
        case 32:case 160:
          // ' '
          ++this.pos;
          break;
        case 13:
          if (this.input.charCodeAt(this.pos + 1) === 10) {
            ++this.pos;
          }
        case 10:case 8232:case 8233:
          ++this.pos;
          if (this.options.locations) {
            ++this.curLine;
            this.lineStart = this.pos;
          }
          break;
        case 47:
          // '/'
          switch (this.input.charCodeAt(this.pos + 1)) {
            case 42:
              // '*'
              this.skipBlockComment();
              break;
            case 47:
              this.skipLineComment(2);
              break;
            default:
              break loop;
          }
          break;
        default:
          if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
            ++this.pos;
          } else {
            break loop;
          }
      }
    }
  };

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp$7.finishToken = function (type, val) {
    this.end = this.pos;
    if (this.options.locations) this.endLoc = this.curPosition();
    var prevType = this.type;
    this.type = type;
    this.value = val;

    this.updateContext(prevType);
  };

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp$7.readToken_dot = function () {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next >= 48 && next <= 57) return this.readNumber(true);
    var next2 = this.input.charCodeAt(this.pos + 2);
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
      // 46 = dot '.'
      this.pos += 3;
      return this.finishToken(tt.ellipsis);
    } else {
      ++this.pos;
      return this.finishToken(tt.dot);
    }
  };

  pp$7.readToken_slash = function () {
    // '/'
    var next = this.input.charCodeAt(this.pos + 1);
    if (this.exprAllowed) {
      ++this.pos;return this.readRegexp();
    }
    if (next === 61) return this.finishOp(tt.assign, 2);
    return this.finishOp(tt.slash, 1);
  };

  pp$7.readToken_mult_modulo = function (code) {
    // '%*'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) return this.finishOp(tt.assign, 2);
    return this.finishOp(code === 42 ? tt.star : tt.modulo, 1);
  };

  pp$7.readToken_pipe_amp = function (code) {
    // '|&'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2);
    if (next === 61) return this.finishOp(tt.assign, 2);
    return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1);
  };

  pp$7.readToken_caret = function () {
    // '^'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) return this.finishOp(tt.assign, 2);
    return this.finishOp(tt.bitwiseXOR, 1);
  };

  pp$7.readToken_plus_min = function (code) {
    // '+-'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
      if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 && lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
        // A `-->` line comment
        this.skipLineComment(3);
        this.skipSpace();
        return this.nextToken();
      }
      return this.finishOp(tt.incDec, 2);
    }
    if (next === 61) return this.finishOp(tt.assign, 2);
    return this.finishOp(tt.plusMin, 1);
  };

  pp$7.readToken_lt_gt = function (code) {
    // '<>'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(tt.assign, size + 1);
      return this.finishOp(tt.bitShift, size);
    }
    if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 && this.input.charCodeAt(this.pos + 3) == 45) {
      if (this.inModule) this.unexpected();
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4);
      this.skipSpace();
      return this.nextToken();
    }
    if (next === 61) size = this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2;
    return this.finishOp(tt.relational, size);
  };

  pp$7.readToken_eq_excl = function (code) {
    // '=!'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
      // '=>'
      this.pos += 2;
      return this.finishToken(tt.arrow);
    }
    return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1);
  };

  pp$7.getTokenFromCode = function (code) {
    switch (code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.
      case 46:
        // '.'
        return this.readToken_dot();

      // Punctuation tokens.
      case 40:
        ++this.pos;return this.finishToken(tt.parenL);
      case 41:
        ++this.pos;return this.finishToken(tt.parenR);
      case 59:
        ++this.pos;return this.finishToken(tt.semi);
      case 44:
        ++this.pos;return this.finishToken(tt.comma);
      case 91:
        ++this.pos;return this.finishToken(tt.bracketL);
      case 93:
        ++this.pos;return this.finishToken(tt.bracketR);
      case 123:
        ++this.pos;return this.finishToken(tt.braceL);
      case 125:
        ++this.pos;return this.finishToken(tt.braceR);
      case 58:
        ++this.pos;return this.finishToken(tt.colon);
      case 63:
        ++this.pos;return this.finishToken(tt.question);

      case 96:
        // '`'
        if (this.options.ecmaVersion < 6) break;
        ++this.pos;
        return this.finishToken(tt.backQuote);

      case 48:
        // '0'
        var next = this.input.charCodeAt(this.pos + 1);
        if (next === 120 || next === 88) return this.readRadixNumber(16); // '0x', '0X' - hex number
        if (this.options.ecmaVersion >= 6) {
          if (next === 111 || next === 79) return this.readRadixNumber(8); // '0o', '0O' - octal number
          if (next === 98 || next === 66) return this.readRadixNumber(2); // '0b', '0B' - binary number
        }
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
      case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
        // 1-9
        return this.readNumber(false);

      // Quotes produce strings.
      case 34:case 39:
        // '"', "'"
        return this.readString(code);

      // Operators are parsed inline in tiny state machines. '=' (61) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

      case 47:
        // '/'
        return this.readToken_slash();

      case 37:case 42:
        // '%*'
        return this.readToken_mult_modulo(code);

      case 124:case 38:
        // '|&'
        return this.readToken_pipe_amp(code);

      case 94:
        // '^'
        return this.readToken_caret();

      case 43:case 45:
        // '+-'
        return this.readToken_plus_min(code);

      case 60:case 62:
        // '<>'
        return this.readToken_lt_gt(code);

      case 61:case 33:
        // '=!'
        return this.readToken_eq_excl(code);

      case 126:
        // '~'
        return this.finishOp(tt.prefix, 1);
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
  };

  pp$7.finishOp = function (type, size) {
    var str = this.input.slice(this.pos, this.pos + size);
    this.pos += size;
    return this.finishToken(type, str);
  };

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function tryCreateRegexp(src, flags, throwErrorAt) {
    try {
      return new RegExp(src, flags);
    } catch (e) {
      if (throwErrorAt !== undefined) {
        if (e instanceof SyntaxError) this.raise(throwErrorAt, "Error parsing regular expression: " + e.message);
        this.raise(e);
      }
    }
  }

  var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u");

  pp$7.readRegexp = function () {
    var _this = this;

    var escaped = undefined,
        inClass = undefined,
        start = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
      var ch = this.input.charAt(this.pos);
      if (lineBreak.test(ch)) this.raise(start, "Unterminated regular expression");
      if (!escaped) {
        if (ch === "[") inClass = true;else if (ch === "]" && inClass) inClass = false;else if (ch === "/" && !inClass) break;
        escaped = ch === "\\";
      } else escaped = false;
      ++this.pos;
    }
    var content = this.input.slice(start, this.pos);
    ++this.pos;
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = this.readWord1();
    var tmp = content;
    if (mods) {
      var validFlags = /^[gmsiy]*$/;
      if (this.options.ecmaVersion >= 6) validFlags = /^[gmsiyu]*$/;
      if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag");
      if (mods.indexOf('u') >= 0 && !regexpUnicodeSupport) {
        // Replace each astral symbol and every Unicode escape sequence that
        // possibly represents an astral symbol or a paired surrogate with a
        // single ASCII symbol to avoid throwing on regular expressions that
        // are only valid in combination with the `/u` flag.
        // Note: replacing with the ASCII symbol `x` might cause false
        // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
        // perfectly valid pattern that is equivalent to `[a-b]`, but it would
        // be replaced by `[x-b]` which throws an error.
        tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (match, code, offset) {
          code = Number("0x" + code);
          if (code > 0x10FFFF) _this.raise(start + offset + 3, "Code point out of bounds");
          return "x";
        });
        tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
      }
    }
    // Detect invalid regular expressions.
    var value = null;
    // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
    // so don't do detection if we are running under Rhino
    if (!isRhino) {
      tryCreateRegexp(tmp, undefined, start);
      // Get a regular expression object for this pattern-flag pair, or `null` in
      // case the current environment doesn't support the flags it uses.
      value = tryCreateRegexp(content, mods);
    }
    return this.finishToken(tt.regexp, { pattern: content, flags: mods, value: value });
  };

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp$7.readInt = function (radix, len) {
    var start = this.pos,
        total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this.input.charCodeAt(this.pos),
          val = undefined;
      if (code >= 97) val = code - 97 + 10; // a
      else if (code >= 65) val = code - 65 + 10; // A
        else if (code >= 48 && code <= 57) val = code - 48; // 0-9
          else val = Infinity;
      if (val >= radix) break;
      ++this.pos;
      total = total * radix + val;
    }
    if (this.pos === start || len != null && this.pos - start !== len) return null;

    return total;
  };

  pp$7.readRadixNumber = function (radix) {
    this.pos += 2; // 0x
    var val = this.readInt(radix);
    if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix);
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
    return this.finishToken(tt.num, val);
  };

  // Read an integer, octal integer, or floating-point number.

  pp$7.readNumber = function (startsWithDot) {
    var start = this.pos,
        isFloat = false,
        octal = this.input.charCodeAt(this.pos) === 48;
    if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number");
    var next = this.input.charCodeAt(this.pos);
    if (next === 46) {
      // '.'
      ++this.pos;
      this.readInt(10);
      isFloat = true;
      next = this.input.charCodeAt(this.pos);
    }
    if (next === 69 || next === 101) {
      // 'eE'
      next = this.input.charCodeAt(++this.pos);
      if (next === 43 || next === 45) ++this.pos; // '+-'
      if (this.readInt(10) === null) this.raise(start, "Invalid number");
      isFloat = true;
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");

    var str = this.input.slice(start, this.pos),
        val = undefined;
    if (isFloat) val = parseFloat(str);else if (!octal || str.length === 1) val = parseInt(str, 10);else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number");else val = parseInt(str, 8);
    return this.finishToken(tt.num, val);
  };

  // Read a string value, interpreting backslash-escapes.

  pp$7.readCodePoint = function () {
    var ch = this.input.charCodeAt(this.pos),
        code = undefined;

    if (ch === 123) {
      if (this.options.ecmaVersion < 6) this.unexpected();
      var codePos = ++this.pos;
      code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos);
      ++this.pos;
      if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds");
    } else {
      code = this.readHexChar(4);
    }
    return code;
  };

  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) return String.fromCharCode(code);
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00);
  }

  pp$7.readString = function (quote) {
    var out = "",
        chunkStart = ++this.pos;
    for (;;) {
      if (this.pos >= this.input.length) this.raise(this.start, "Unterminated string constant");
      var ch = this.input.charCodeAt(this.pos);
      if (ch === quote) break;
      if (ch === 92) {
        // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(false);
        chunkStart = this.pos;
      } else {
        if (isNewLine(ch)) this.raise(this.start, "Unterminated string constant");
        ++this.pos;
      }
    }
    out += this.input.slice(chunkStart, this.pos++);
    return this.finishToken(tt.string, out);
  };

  // Reads template string tokens.

  pp$7.readTmplToken = function () {
    var out = "",
        chunkStart = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) this.raise(this.start, "Unterminated template");
      var ch = this.input.charCodeAt(this.pos);
      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
        // '`', '${'
        if (this.pos === this.start && this.type === tt.template) {
          if (ch === 36) {
            this.pos += 2;
            return this.finishToken(tt.dollarBraceL);
          } else {
            ++this.pos;
            return this.finishToken(tt.backQuote);
          }
        }
        out += this.input.slice(chunkStart, this.pos);
        return this.finishToken(tt.template, out);
      }
      if (ch === 92) {
        // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(true);
        chunkStart = this.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.pos);
        ++this.pos;
        switch (ch) {
          case 13:
            if (this.input.charCodeAt(this.pos) === 10) ++this.pos;
          case 10:
            out += "\n";
            break;
          default:
            out += String.fromCharCode(ch);
            break;
        }
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        chunkStart = this.pos;
      } else {
        ++this.pos;
      }
    }
  };

  // Used to read escaped characters

  pp$7.readEscapedChar = function (inTemplate) {
    var ch = this.input.charCodeAt(++this.pos);
    ++this.pos;
    switch (ch) {
      case 110:
        return "\n"; // 'n' -> '\n'
      case 114:
        return "\r"; // 'r' -> '\r'
      case 120:
        return String.fromCharCode(this.readHexChar(2)); // 'x'
      case 117:
        return codePointToString(this.readCodePoint()); // 'u'
      case 116:
        return "\t"; // 't' -> '\t'
      case 98:
        return "\b"; // 'b' -> '\b'
      case 118:
        return "\u000b"; // 'v' -> '\u000b'
      case 102:
        return "\f"; // 'f' -> '\f'
      case 13:
        if (this.input.charCodeAt(this.pos) === 10) ++this.pos; // '\r\n'
      case 10:
        // ' \n'
        if (this.options.locations) {
          this.lineStart = this.pos;++this.curLine;
        }
        return "";
      default:
        if (ch >= 48 && ch <= 55) {
          var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
          var octal = parseInt(octalStr, 8);
          if (octal > 255) {
            octalStr = octalStr.slice(0, -1);
            octal = parseInt(octalStr, 8);
          }
          if (octal > 0 && (this.strict || inTemplate)) {
            this.raise(this.pos - 2, "Octal literal in strict mode");
          }
          this.pos += octalStr.length - 1;
          return String.fromCharCode(octal);
        }
        return String.fromCharCode(ch);
    }
  };

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp$7.readHexChar = function (len) {
    var codePos = this.pos;
    var n = this.readInt(16, len);
    if (n === null) this.raise(codePos, "Bad character escape sequence");
    return n;
  };

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp$7.readWord1 = function () {
    this.containsEsc = false;
    var word = "",
        first = true,
        chunkStart = this.pos;
    var astral = this.options.ecmaVersion >= 6;
    while (this.pos < this.input.length) {
      var ch = this.fullCharCodeAtPos();
      if (isIdentifierChar(ch, astral)) {
        this.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) {
        // "\"
        this.containsEsc = true;
        word += this.input.slice(chunkStart, this.pos);
        var escStart = this.pos;
        if (this.input.charCodeAt(++this.pos) != 117) // "u"
          this.raise(this.pos, "Expecting Unicode escape sequence \\uXXXX");
        ++this.pos;
        var esc = this.readCodePoint();
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral)) this.raise(escStart, "Invalid Unicode escape");
        word += codePointToString(esc);
        chunkStart = this.pos;
      } else {
        break;
      }
      first = false;
    }
    return word + this.input.slice(chunkStart, this.pos);
  };

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp$7.readWord = function () {
    var word = this.readWord1();
    var type = tt.name;
    if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.isKeyword(word)) type = keywordTypes[word];
    return this.finishToken(type, word);
  };

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api].
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  function parse(input, options) {
    return new Parser(options, input).parse();
  }

  function walk(ast, _ref) {
    var enter = _ref.enter;
    var leave = _ref.leave;

    visit(ast, null, enter, leave);
  }

  var context = {
    skip: function () {
      return context.shouldSkip = true;
    }
  };

  var childKeys = {};

  var toString = Object.prototype.toString;

  function isArray(thing) {
    return toString.call(thing) === '[object Array]';
  }

  function visit(node, parent, enter, leave, prop, index) {
    if (!node) return;

    if (enter) {
      context.shouldSkip = false;
      enter.call(context, node, parent, prop, index);
      if (context.shouldSkip) return;
    }

    var keys = childKeys[node.type] || (childKeys[node.type] = Object.keys(node).filter(function (prop) {
      return typeof node[prop] === 'object';
    }));

    var key = undefined,
        value = undefined,
        i = undefined,
        j = undefined;

    i = keys.length;
    while (i--) {
      key = keys[i];
      value = node[key];

      if (isArray(value)) {
        j = value.length;
        while (j--) {
          visit(value[j], node, enter, leave, key, j);
        }
      } else if (value && value.type) {
        visit(value, node, enter, leave, key, null);
      }
    }

    if (leave) {
      leave(node, parent, prop, index);
    }
  }

  var extractors = {
    Identifier: function (names, param) {
      names.push(param.name);
    },

    ObjectPattern: function (names, param) {
      param.properties.forEach(function (prop) {
        extractors[prop.key.type](names, prop.key);
      });
    },

    ArrayPattern: function (names, param) {
      param.elements.forEach(function (element) {
        if (element) extractors[element.type](names, element);
      });
    },

    RestElement: function (names, param) {
      extractors[param.argument.type](names, param.argument);
    },

    AssignmentPattern: function (names, param) {
      return extractors[param.left.type](names, param.left);
    }
  };

  function extractNames(param) {
    var names = [];

    extractors[param.type](names, param);
    return names;
  }

  var Declaration = (function () {
    function Declaration() {
      babelHelpers_classCallCheck(this, Declaration);

      this.statement = null;
      this.name = null;

      this.isReassigned = false;
      this.aliases = [];
    }

    Declaration.prototype.addAlias = function addAlias(declaration) {
      this.aliases.push(declaration);
    };

    Declaration.prototype.addReference = function addReference(reference) {
      reference.declaration = this;
      this.name = reference.name; // TODO handle differences of opinion

      if (reference.isReassignment) this.isReassigned = true;
    };

    Declaration.prototype.render = function render(es6) {
      if (es6) return this.name;
      if (!this.isReassigned || !this.isExported) return this.name;

      return 'exports.' + this.name;
    };

    Declaration.prototype.use = function use() {
      this.isUsed = true;
      if (this.statement) this.statement.mark();

      this.aliases.forEach(function (alias) {
        return alias.use();
      });
    };

    return Declaration;
  })();

  var Scope = (function () {
    function Scope(options) {
      var _this = this;

      babelHelpers_classCallCheck(this, Scope);

      options = options || {};

      this.parent = options.parent;
      this.isBlockScope = !!options.block;

      this.declarations = blank();

      if (options.params) {
        options.params.forEach(function (param) {
          extractNames(param).forEach(function (name) {
            _this.declarations[name] = new Declaration(name);
          });
        });
      }
    }

    Scope.prototype.addDeclaration = function addDeclaration(node, isBlockDeclaration, isVar) {
      var _this2 = this;

      if (!isBlockDeclaration && this.isBlockScope) {
        // it's a `var` or function node, and this
        // is a block scope, so we need to go up
        this.parent.addDeclaration(node, isBlockDeclaration, isVar);
      } else {
        extractNames(node.id).forEach(function (name) {
          _this2.declarations[name] = new Declaration(name);
        });
      }
    };

    Scope.prototype.contains = function contains(name) {
      return this.declarations[name] || (this.parent ? this.parent.contains(name) : false);
    };

    Scope.prototype.eachDeclaration = function eachDeclaration(fn) {
      var _this3 = this;

      keys(this.declarations).forEach(function (key) {
        fn(key, _this3.declarations[key]);
      });
    };

    Scope.prototype.findDeclaration = function findDeclaration(name) {
      return this.declarations[name] || this.parent && this.parent.findDeclaration(name);
    };

    return Scope;
  })();

  var blockDeclarations = {
    'const': true,
    'let': true
  };
  function attachScopes(statement) {
    var node = statement.node;
    var scope = statement.scope;

    walk(node, {
      enter: function (node, parent) {
        // function foo () {...}
        // class Foo {...}
        if (/(Function|Class)Declaration/.test(node.type)) {
          scope.addDeclaration(node, false, false);
        }

        // var foo = 1
        if (node.type === 'VariableDeclaration') {
          var isBlockDeclaration = blockDeclarations[node.kind];
          // only one declarator per block, because we split them up already
          scope.addDeclaration(node.declarations[0], isBlockDeclaration, true);
        }

        var newScope = undefined;

        // create new function scope
        if (/Function/.test(node.type)) {
          newScope = new Scope({
            parent: scope,
            block: false,
            params: node.params
          });

          // named function expressions - the name is considered
          // part of the function's scope
          if (node.type === 'FunctionExpression' && node.id) {
            newScope.addDeclaration(node, false, false);
          }
        }

        // create new block scope
        if (node.type === 'BlockStatement' && !/Function/.test(parent.type)) {
          newScope = new Scope({
            parent: scope,
            block: true
          });
        }

        // catch clause has its own block scope
        if (node.type === 'CatchClause') {
          newScope = new Scope({
            parent: scope,
            params: [node.param],
            block: true
          });
        }

        if (newScope) {
          Object.defineProperty(node, '_scope', {
            value: newScope,
            configurable: true
          });

          scope = newScope;
        }
      },
      leave: function (node) {
        if (node._scope) {
          scope = scope.parent;
        }
      }
    });
  }

  function getLocation(source, charIndex) {
    var lines = source.split('\n');
    var len = lines.length;

    var lineStart = 0;
    var i = undefined;

    for (i = 0; i < len; i += 1) {
      var line = lines[i];
      var lineEnd = lineStart + line.length + 1; // +1 for newline

      if (lineEnd > charIndex) {
        return { line: i + 1, column: charIndex - lineStart };
      }

      lineStart = lineEnd;
    }

    throw new Error('Could not determine location of character');
  }

  var modifierNodes = {
    AssignmentExpression: 'left',
    UpdateExpression: 'argument'
  };

  function isIife(node, parent) {
    return parent && parent.type === 'CallExpression' && node === parent.callee;
  }

  function isReference(node, parent) {
    if (node.type === 'MemberExpression') {
      return !node.computed && isReference(node.object, node);
    }

    if (node.type === 'Identifier') {
      // TODO is this right?
      if (parent.type === 'MemberExpression') return parent.computed || node === parent.object;

      // disregard the `bar` in { bar: foo }
      if (parent.type === 'Property' && node !== parent.value) return false;

      // disregard the `bar` in `class Foo { bar () {...} }`
      if (parent.type === 'MethodDefinition') return false;

      // disregard the `bar` in `export { foo as bar }`
      if (parent.type === 'ExportSpecifier' && node !== parent.local) return;

      return true;
    }
  }

  var Reference = function Reference(node, scope) {
    babelHelpers_classCallCheck(this, Reference);

    this.node = node;
    this.scope = scope;

    this.declaration = null; // bound later

    this.parts = [];

    var root = node;
    while (root.type === 'MemberExpression') {
      this.parts.unshift(root.property.name);
      root = root.object;
    }

    this.name = root.name;

    this.start = node.start;
    this.end = node.start + this.name.length; // can be overridden in the case of namespace members
    this.rewritten = false;
  };

  var Statement = (function () {
    function Statement(node, module, start, end) {
      babelHelpers_classCallCheck(this, Statement);

      this.node = node;
      this.module = module;
      this.start = start;
      this.end = end;
      this.next = null; // filled in later

      this.scope = new Scope();

      this.references = [];
      this.stringLiteralRanges = [];

      this.isIncluded = false;

      this.isImportDeclaration = node.type === 'ImportDeclaration';
      this.isExportDeclaration = /^Export/.test(node.type);
      this.isReexportDeclaration = this.isExportDeclaration && !!node.source;
    }

    Statement.prototype.analyse = function analyse() {
      var _this = this;

      if (this.isImportDeclaration) return; // nothing to analyse

      // attach scopes
      attachScopes(this);

      // attach statement to each top-level declaration,
      // so we can mark statements easily
      this.scope.eachDeclaration(function (name, declaration) {
        declaration.statement = _this;
      });

      // find references
      var module = this.module;
      var references = this.references;
      var scope = this.scope;
      var stringLiteralRanges = this.stringLiteralRanges;

      var readDepth = 0;

      walk(this.node, {
        enter: function (node, parent) {
          if (node.type === 'TemplateElement') stringLiteralRanges.push([node.start, node.end]);
          if (node.type === 'Literal' && typeof node.value === 'string' && /\n/.test(node.raw)) {
            stringLiteralRanges.push([node.start + 1, node.end - 1]);
          }

          if (node._scope) scope = node._scope;
          if (/Function/.test(node.type) && !isIife(node, parent)) readDepth += 1;

          // special case – shorthand properties. because node.key === node.value,
          // we can't differentiate once we've descended into the node
          if (node.type === 'Property' && node.shorthand) {
            var reference = new Reference(node.key, scope);
            reference.isShorthandProperty = true; // TODO feels a bit kludgy
            references.push(reference);
            return this.skip();
          }

          var isReassignment = undefined;

          if (parent && parent.type in modifierNodes) {
            var subject = parent[modifierNodes[parent.type]];
            var depth = 0;

            while (subject.type === 'MemberExpression') {
              subject = subject.object;
              depth += 1;
            }

            var importDeclaration = module.imports[subject.name];

            if (!scope.contains(subject.name) && importDeclaration) {
              var minDepth = importDeclaration.name === '*' ? 2 : // cannot do e.g. `namespace.foo = bar`
              1; // cannot do e.g. `foo = bar`, but `foo.bar = bar` is fine

              if (depth < minDepth) {
                var err = new Error('Illegal reassignment to import \'' + subject.name + '\'');
                err.file = module.id;
                err.loc = getLocation(module.magicString.toString(), subject.start);
                throw err;
              }
            }

            isReassignment = !depth;
          }

          if (isReference(node, parent)) {
            // function declaration IDs are a special case – they're associated
            // with the parent scope
            var referenceScope = parent.type === 'FunctionDeclaration' && node === parent.id ? scope.parent : scope;

            var reference = new Reference(node, referenceScope);
            references.push(reference);

            reference.isImmediatelyUsed = !readDepth;
            reference.isReassignment = isReassignment;

            this.skip(); // don't descend from `foo.bar.baz` into `foo.bar`
          }
        },
        leave: function (node, parent) {
          if (node._scope) scope = scope.parent;
          if (/Function/.test(node.type) && !isIife(node, parent)) readDepth -= 1;
        }
      });
    };

    Statement.prototype.mark = function mark() {
      if (this.isIncluded) return; // prevent infinite loops
      this.isIncluded = true;

      this.references.forEach(function (reference) {
        if (reference.declaration) reference.declaration.use();
      });
    };

    Statement.prototype.markSideEffect = function markSideEffect() {
      if (this.isIncluded) return;

      var statement = this;
      var hasSideEffect = false;

      walk(this.node, {
        enter: function (node, parent) {
          if (/Function/.test(node.type) && !isIife(node, parent)) return this.skip();

          // If this is a top-level call expression, or an assignment to a global,
          // this statement will need to be marked
          if (node.type === 'CallExpression' || node.type === 'NewExpression') {
            hasSideEffect = true;
          } else if (node.type in modifierNodes) {
            var subject = node[modifierNodes[node.type]];
            while (subject.type === 'MemberExpression') subject = subject.object;

            var declaration = statement.module.trace(subject.name);

            if (!declaration || declaration.isExternal || declaration.statement.isIncluded) {
              hasSideEffect = true;
            }
          }

          if (hasSideEffect) this.skip();
        }
      });

      if (hasSideEffect) statement.mark();
      return hasSideEffect;
    };

    Statement.prototype.source = function source() {
      return this.module.source.slice(this.start, this.end);
    };

    Statement.prototype.toString = function toString() {
      return this.module.magicString.slice(this.start, this.end);
    };

    return Statement;
  })();

  var reservedWords = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public'.split(' ');
  var builtins = 'Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl'.split(' ');

  var blacklisted = blank();
  reservedWords.concat(builtins).forEach(function (word) {
    return blacklisted[word] = true;
  });
  function makeLegalIdentifier(str) {
    str = str.replace(/-(\w)/g, function (_, letter) {
      return letter.toUpperCase();
    }).replace(/[^$_a-zA-Z0-9]/g, '_');

    if (/\d/.test(str[0]) || blacklisted[str]) str = '_' + str;

    return str;
  }

  var SyntheticDefaultDeclaration = (function () {
    function SyntheticDefaultDeclaration(node, statement, name) {
      babelHelpers_classCallCheck(this, SyntheticDefaultDeclaration);

      this.node = node;
      this.statement = statement;
      this.name = name;

      this.original = null;
      this.isExported = false;
      this.aliases = [];
    }

    SyntheticDefaultDeclaration.prototype.addAlias = function addAlias(declaration) {
      this.aliases.push(declaration);
    };

    SyntheticDefaultDeclaration.prototype.addReference = function addReference(reference) {
      reference.declaration = this;
      this.name = reference.name;
    };

    SyntheticDefaultDeclaration.prototype.bind = function bind(declaration) {
      this.original = declaration;
    };

    SyntheticDefaultDeclaration.prototype.render = function render() {
      return !this.original || this.original.isReassigned ? this.name : this.original.render();
    };

    SyntheticDefaultDeclaration.prototype.use = function use() {
      this.isUsed = true;
      this.statement.mark();

      if (this.original) this.original.use();

      this.aliases.forEach(function (alias) {
        return alias.use();
      });
    };

    return SyntheticDefaultDeclaration;
  })();

  var SyntheticNamespaceDeclaration = (function () {
    function SyntheticNamespaceDeclaration(module) {
      var _this = this;

      babelHelpers_classCallCheck(this, SyntheticNamespaceDeclaration);

      this.module = module;
      this.name = null;

      this.needsNamespaceBlock = false;
      this.aliases = [];

      this.originals = blank();
      module.getExports().forEach(function (name) {
        _this.originals[name] = module.traceExport(name);
      });
    }

    SyntheticNamespaceDeclaration.prototype.addAlias = function addAlias(declaration) {
      this.aliases.push(declaration);
    };

    SyntheticNamespaceDeclaration.prototype.addReference = function addReference(reference) {
      // if we have e.g. `foo.bar`, we can optimise
      // the reference by pointing directly to `bar`
      if (reference.parts.length) {
        reference.name = reference.parts.shift();

        reference.end += reference.name.length + 1; // TODO this is brittle

        var original = this.originals[reference.name];

        // throw with an informative error message if the reference doesn't exist.
        if (!original) {
          var err = new Error('Export \'' + reference.name + '\' is not defined by \'' + this.module.id + '\'');
          err.code = 'MISSING_EXPORT';
          err.file = this.module.id;
          throw err;
        }

        original.addReference(reference);
        return;
      }

      // otherwise we're accessing the namespace directly,
      // which means we need to mark all of this module's
      // exports and render a namespace block in the bundle
      if (!this.needsNamespaceBlock) {
        this.needsNamespaceBlock = true;
        this.module.bundle.internalNamespaces.push(this);
      }

      reference.declaration = this;
      this.name = reference.name;
    };

    SyntheticNamespaceDeclaration.prototype.renderBlock = function renderBlock(indentString) {
      var _this2 = this;

      var members = keys(this.originals).map(function (name) {
        var original = _this2.originals[name];

        if (original.isReassigned) {
          return indentString + 'get ' + name + ' () { return ' + original.render() + '; }';
        }

        return '' + indentString + name + ': ' + original.render();
      });

      return 'var ' + this.render() + ' = {\n' + members.join(',\n') + '\n};\n\n';
    };

    SyntheticNamespaceDeclaration.prototype.render = function render() {
      return this.name;
    };

    SyntheticNamespaceDeclaration.prototype.use = function use() {
      var _this3 = this;

      keys(this.originals).forEach(function (name) {
        _this3.originals[name].use();
      });

      this.aliases.forEach(function (alias) {
        return alias.use();
      });
    };

    return SyntheticNamespaceDeclaration;
  })();

  var Module = (function () {
    function Module(_ref) {
      var id = _ref.id;
      var code = _ref.code;
      var originalCode = _ref.originalCode;
      var ast = _ref.ast;
      var sourceMapChain = _ref.sourceMapChain;
      var bundle = _ref.bundle;
      babelHelpers_classCallCheck(this, Module);

      this.code = code;
      this.originalCode = originalCode;
      this.sourceMapChain = sourceMapChain;

      this.bundle = bundle;
      this.id = id;

      // all dependencies
      this.dependencies = [];
      this.resolvedIds = blank();

      // imports and exports, indexed by local name
      this.imports = blank();
      this.exports = blank();
      this.reexports = blank();

      this.exportAllSources = [];
      this.exportAllModules = null;

      // By default, `id` is the filename. Custom resolvers and loaders
      // can change that, but it makes sense to use it for the source filename
      this.magicString = new MagicString(code, {
        filename: id,
        indentExclusionRanges: []
      });

      // remove existing sourceMappingURL comments
      var pattern = new RegExp('\\/\\/#\\s+' + SOURCEMAPPING_URL$1 + '=.+\\n?', 'g');
      var match = undefined;
      while (match = pattern.exec(code)) {
        this.magicString.remove(match.index, match.index + match[0].length);
      }

      this.comments = [];
      this.statements = this.parse(ast);

      this.declarations = blank();
      this.analyse();
    }

    Module.prototype.addExport = function addExport(statement) {
      var _this4 = this;

      var node = statement.node;
      var source = node.source && node.source.value;

      // export { name } from './other'
      if (source) {
        if (! ~this.dependencies.indexOf(source)) this.dependencies.push(source);

        if (node.type === 'ExportAllDeclaration') {
          // Store `export * from '...'` statements in an array of delegates.
          // When an unknown import is encountered, we see if one of them can satisfy it.
          this.exportAllSources.push(source);
        } else {
          node.specifiers.forEach(function (specifier) {
            _this4.reexports[specifier.exported.name] = {
              source: source,
              localName: specifier.local.name,
              module: null // filled in later
            };
          });
        }
      }

      // export default function foo () {}
      // export default foo;
      // export default 42;
      else if (node.type === 'ExportDefaultDeclaration') {
          var identifier = node.declaration.id && node.declaration.id.name || node.declaration.name;

          this.exports.default = {
            localName: 'default',
            identifier: identifier
          };

          // create a synthetic declaration
          this.declarations.default = new SyntheticDefaultDeclaration(node, statement, identifier || this.basename());
        }

        // export { foo, bar, baz }
        // export var foo = 42;
        // export var a = 1, b = 2, c = 3;
        // export function foo () {}
        else if (node.type === 'ExportNamedDeclaration') {
            if (node.specifiers.length) {
              // export { foo, bar, baz }
              node.specifiers.forEach(function (specifier) {
                var localName = specifier.local.name;
                var exportedName = specifier.exported.name;

                _this4.exports[exportedName] = { localName: localName };
              });
            } else {
              var declaration = node.declaration;

              var _name = undefined;

              if (declaration.type === 'VariableDeclaration') {
                // export var foo = 42
                _name = declaration.declarations[0].id.name;
              } else {
                // export function foo () {}
                _name = declaration.id.name;
              }

              this.exports[_name] = { localName: _name };
            }
          }
    };

    Module.prototype.addImport = function addImport(statement) {
      var _this5 = this;

      var node = statement.node;
      var source = node.source.value;

      if (! ~this.dependencies.indexOf(source)) this.dependencies.push(source);

      node.specifiers.forEach(function (specifier) {
        var localName = specifier.local.name;

        if (_this5.imports[localName]) {
          var err = new Error('Duplicated import \'' + localName + '\'');
          err.file = _this5.id;
          err.loc = getLocation(_this5.code, specifier.start);
          throw err;
        }

        var isDefault = specifier.type === 'ImportDefaultSpecifier';
        var isNamespace = specifier.type === 'ImportNamespaceSpecifier';

        var name = isDefault ? 'default' : isNamespace ? '*' : specifier.imported.name;
        _this5.imports[localName] = { source: source, name: name, module: null };
      });
    };

    Module.prototype.analyse = function analyse() {
      var _this6 = this;

      // discover this module's imports and exports
      this.statements.forEach(function (statement) {
        if (statement.isImportDeclaration) _this6.addImport(statement);else if (statement.isExportDeclaration) _this6.addExport(statement);

        statement.analyse();

        statement.scope.eachDeclaration(function (name, declaration) {
          _this6.declarations[name] = declaration;
        });
      });
    };

    Module.prototype.basename = function basename() {
      var base = _basename(this.id);
      var ext = extname(this.id);

      return makeLegalIdentifier(ext ? base.slice(0, -ext.length) : base);
    };

    Module.prototype.bindAliases = function bindAliases() {
      var _this7 = this;

      keys(this.declarations).forEach(function (name) {
        if (name === '*') return;

        var declaration = _this7.declarations[name];
        var statement = declaration.statement;

        if (statement.node.type !== 'VariableDeclaration') return;

        statement.references.forEach(function (reference) {
          if (reference.name === name || !reference.isImmediatelyUsed) return;

          var otherDeclaration = _this7.trace(reference.name);
          if (otherDeclaration) otherDeclaration.addAlias(declaration);
        });
      });
    };

    Module.prototype.bindImportSpecifiers = function bindImportSpecifiers() {
      var _this8 = this;

      [this.imports, this.reexports].forEach(function (specifiers) {
        keys(specifiers).forEach(function (name) {
          var specifier = specifiers[name];

          var id = _this8.resolvedIds[specifier.source];
          specifier.module = _this8.bundle.moduleById[id];
        });
      });

      this.exportAllModules = this.exportAllSources.map(function (source) {
        var id = _this8.resolvedIds[source];
        return _this8.bundle.moduleById[id];
      });
    };

    Module.prototype.bindReferences = function bindReferences() {
      var _this9 = this;

      if (this.declarations.default) {
        if (this.exports.default.identifier) {
          var declaration = this.trace(this.exports.default.identifier);
          if (declaration) this.declarations.default.bind(declaration);
        }
      }

      this.statements.forEach(function (statement) {
        // skip `export { foo, bar, baz }`...
        if (statement.node.type === 'ExportNamedDeclaration' && statement.node.specifiers.length) {
          // ...unless this is the entry module
          if (_this9 !== _this9.bundle.entryModule) return;
        }

        statement.references.forEach(function (reference) {
          var declaration = reference.scope.findDeclaration(reference.name) || _this9.trace(reference.name);

          if (declaration) {
            declaration.addReference(reference);
          } else {
            // TODO handle globals
            _this9.bundle.assumedGlobals[reference.name] = true;
          }
        });
      });
    };

    Module.prototype.consolidateDependencies = function consolidateDependencies() {
      var _this10 = this;

      var strongDependencies = blank();
      var weakDependencies = blank();

      // treat all imports as weak dependencies
      this.dependencies.forEach(function (source) {
        var id = _this10.resolvedIds[source];
        var dependency = _this10.bundle.moduleById[id];

        if (!dependency.isExternal) {
          weakDependencies[dependency.id] = dependency;
        }
      });

      // identify strong dependencies to break ties in case of cycles
      this.statements.forEach(function (statement) {
        statement.references.forEach(function (reference) {
          var declaration = reference.declaration;

          if (declaration && declaration.statement) {
            var _module = declaration.statement.module;
            if (_module === _this10) return;

            // TODO disregard function declarations
            if (reference.isImmediatelyUsed) {
              strongDependencies[_module.id] = _module;
            }
          }
        });
      });

      return { strongDependencies: strongDependencies, weakDependencies: weakDependencies };
    };

    Module.prototype.getExports = function getExports() {
      var exports = blank();

      keys(this.exports).forEach(function (name) {
        exports[name] = true;
      });

      keys(this.reexports).forEach(function (name) {
        exports[name] = true;
      });

      this.exportAllModules.forEach(function (module) {
        module.getExports().forEach(function (name) {
          if (name !== 'default') exports[name] = true;
        });
      });

      return keys(exports);
    };

    Module.prototype.markAllSideEffects = function markAllSideEffects() {
      var hasSideEffect = false;

      this.statements.forEach(function (statement) {
        if (statement.markSideEffect()) hasSideEffect = true;
      });

      return hasSideEffect;
    };

    Module.prototype.namespace = function namespace() {
      if (!this.declarations['*']) {
        this.declarations['*'] = new SyntheticNamespaceDeclaration(this);
      }

      return this.declarations['*'];
    };

    Module.prototype.parse = function parse$$(ast) {
      var _this11 = this;

      // The ast can be supplied programmatically (but usually won't be)
      if (!ast) {
        // Try to extract a list of top-level statements/declarations. If
        // the parse fails, attach file info and abort
        try {
          ast = parse(this.code, {
            ecmaVersion: 6,
            sourceType: 'module',
            onComment: function (block, text, start, end) {
              return _this11.comments.push({ block: block, text: text, start: start, end: end });
            },
            preserveParens: true
          });
        } catch (err) {
          err.code = 'PARSE_ERROR';
          err.file = this.id; // see above - not necessarily true, but true enough
          err.message += ' in ' + this.id;
          throw err;
        }
      }

      walk(ast, {
        enter: function (node) {
          _this11.magicString.addSourcemapLocation(node.start);
          _this11.magicString.addSourcemapLocation(node.end);
        }
      });

      var statements = [];
      var lastChar = 0;
      var commentIndex = 0;

      ast.body.forEach(function (node) {
        if (node.type === 'EmptyStatement') return;

        if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'VariableDeclaration' && node.declaration.declarations && node.declaration.declarations.length > 1) {
          // push a synthetic export declaration
          var syntheticNode = {
            type: 'ExportNamedDeclaration',
            specifiers: node.declaration.declarations.map(function (declarator) {
              var id = { name: declarator.id.name };
              return {
                local: id,
                exported: id
              };
            }),
            isSynthetic: true
          };

          var statement = new Statement(syntheticNode, _this11, node.start, node.start);
          statements.push(statement);

          _this11.magicString.remove(node.start, node.declaration.start);
          node = node.declaration;
        }

        // special case - top-level var declarations with multiple declarators
        // should be split up. Otherwise, we may end up including code we
        // don't need, just because an unwanted declarator is included
        if (node.type === 'VariableDeclaration' && node.declarations.length > 1) {
          // remove the leading var/let/const... UNLESS the previous node
          // was also a synthetic node, in which case it'll get removed anyway
          var lastStatement = statements[statements.length - 1];
          if (!lastStatement || !lastStatement.node.isSynthetic) {
            _this11.magicString.remove(node.start, node.declarations[0].start);
          }

          node.declarations.forEach(function (declarator) {
            var start = declarator.start;
            var end = declarator.end;

            var syntheticNode = {
              type: 'VariableDeclaration',
              kind: node.kind,
              start: start,
              end: end,
              declarations: [declarator],
              isSynthetic: true
            };

            var statement = new Statement(syntheticNode, _this11, start, end);
            statements.push(statement);
          });

          lastChar = node.end; // TODO account for trailing line comment
        } else {
            var comment = undefined;
            do {
              comment = _this11.comments[commentIndex];
              if (!comment) break;
              if (comment.start > node.start) break;
              commentIndex += 1;
            } while (comment.end < lastChar);

            var start = comment ? Math.min(comment.start, node.start) : node.start;
            var end = node.end; // TODO account for trailing line comment

            var statement = new Statement(node, _this11, start, end);
            statements.push(statement);

            lastChar = end;
          }
      });

      var i = statements.length;
      var next = this.code.length;
      while (i--) {
        statements[i].next = next;
        if (!statements[i].isSynthetic) next = statements[i].start;
      }

      return statements;
    };

    Module.prototype.render = function render(es6) {
      var _this12 = this;

      var magicString = this.magicString.clone();

      this.statements.forEach(function (statement) {
        if (!statement.isIncluded) {
          magicString.remove(statement.start, statement.next);
          return;
        }

        statement.stringLiteralRanges.forEach(function (range) {
          return magicString.indentExclusionRanges.push(range);
        });

        // skip `export { foo, bar, baz }`
        if (statement.node.type === 'ExportNamedDeclaration') {
          if (statement.node.isSynthetic) return;

          // skip `export { foo, bar, baz }`
          if (statement.node.specifiers.length) {
            magicString.remove(statement.start, statement.next);
            return;
          }
        }

        // split up/remove var declarations as necessary
        if (statement.node.isSynthetic) {
          // insert `var/let/const` if necessary
          var declaration = _this12.declarations[statement.node.declarations[0].id.name];
          if (!(declaration.isExported && declaration.isReassigned)) {
            // TODO encapsulate this
            magicString.insert(statement.start, statement.node.kind + ' ');
          }

          magicString.overwrite(statement.end, statement.next, ';\n'); // TODO account for trailing newlines
        }

        var toDeshadow = blank();

        statement.references.forEach(function (reference) {
          var declaration = reference.declaration;

          if (declaration) {
            var start = reference.start;
            var end = reference.end;

            var _name2 = declaration.render(es6);

            // the second part of this check is necessary because of
            // namespace optimisation – name of `foo.bar` could be `bar`
            if (reference.name === _name2 && _name2.length === reference.end - reference.start) return;

            reference.rewritten = true;

            // prevent local variables from shadowing renamed references
            var identifier = _name2.match(/[^\.]+/)[0];
            if (reference.scope.contains(identifier)) {
              toDeshadow[identifier] = identifier + '$$'; // TODO more robust mechanism
            }

            if (reference.isShorthandProperty) {
              magicString.insert(end, ': ' + _name2);
            } else {
              magicString.overwrite(start, end, _name2, true);
            }
          }
        });

        if (keys(toDeshadow).length) {
          statement.references.forEach(function (reference) {
            if (!reference.rewritten && reference.name in toDeshadow) {
              magicString.overwrite(reference.start, reference.end, toDeshadow[reference.name], true);
            }
          });
        }

        // modify exports as necessary
        if (statement.isExportDeclaration) {
          // remove `export` from `export var foo = 42`
          if (statement.node.type === 'ExportNamedDeclaration' && statement.node.declaration.type === 'VariableDeclaration') {
            var _name3 = statement.node.declaration.declarations[0].id.name;
            var declaration = _this12.declarations[_name3];

            var end = declaration.isExported && declaration.isReassigned ? statement.node.declaration.declarations[0].start : statement.node.declaration.start;

            magicString.remove(statement.node.start, end);
          } else if (statement.node.type === 'ExportAllDeclaration') {
            // TODO: remove once `export * from 'external'` is supported.
            magicString.remove(statement.start, statement.next);
          }

          // remove `export` from `export class Foo {...}` or `export default Foo`
          // TODO default exports need different treatment
          else if (statement.node.declaration.id) {
              magicString.remove(statement.node.start, statement.node.declaration.start);
            } else if (statement.node.type === 'ExportDefaultDeclaration') {
              var defaultDeclaration = _this12.declarations.default;

              // prevent `var foo = foo`
              if (defaultDeclaration.original && !defaultDeclaration.original.isReassigned) {
                magicString.remove(statement.start, statement.next);
                return;
              }

              var defaultName = defaultDeclaration.render();

              // prevent `var undefined = sideEffectyDefault(foo)`
              if (!defaultDeclaration.isExported && !defaultDeclaration.isUsed) {
                magicString.remove(statement.start, statement.node.declaration.start);
                return;
              }

              // anonymous functions should be converted into declarations
              if (statement.node.declaration.type === 'FunctionExpression') {
                magicString.overwrite(statement.node.start, statement.node.declaration.start + 8, 'function ' + defaultName);
              } else {
                magicString.overwrite(statement.node.start, statement.node.declaration.start, 'var ' + defaultName + ' = ');
              }
            } else {
              throw new Error('Unhandled export');
            }
        }
      });

      // add namespace block if necessary
      var namespace = this.declarations['*'];
      if (namespace && namespace.needsNamespaceBlock) {
        magicString.append('\n\n' + namespace.renderBlock(magicString.getIndentString()));
      }

      return magicString.trim();
    };

    Module.prototype.trace = function trace(name) {
      if (name in this.declarations) return this.declarations[name];
      if (name in this.imports) {
        var importDeclaration = this.imports[name];
        var otherModule = importDeclaration.module;

        if (importDeclaration.name === '*' && !otherModule.isExternal) {
          return otherModule.namespace();
        }

        return otherModule.traceExport(importDeclaration.name, this);
      }

      return null;
    };

    Module.prototype.traceExport = function traceExport(name, importer) {
      // export { foo } from './other'
      var reexportDeclaration = this.reexports[name];
      if (reexportDeclaration) {
        return reexportDeclaration.module.traceExport(reexportDeclaration.localName, this);
      }

      var exportDeclaration = this.exports[name];
      if (exportDeclaration) {
        return this.trace(exportDeclaration.localName);
      }

      for (var i = 0; i < this.exportAllModules.length; i += 1) {
        var _module2 = this.exportAllModules[i];
        var declaration = _module2.traceExport(name, this);

        if (declaration) return declaration;
      }

      var errorMessage = 'Module ' + this.id + ' does not export ' + name;
      if (importer) errorMessage += ' (imported by ' + importer.id + ')';

      throw new Error(errorMessage);
    };

    return Module;
  })();

  var ExternalDeclaration = (function () {
    function ExternalDeclaration(module, name) {
      babelHelpers_classCallCheck(this, ExternalDeclaration);

      this.module = module;
      this.name = name;
      this.isExternal = true;
    }

    ExternalDeclaration.prototype.addAlias = function addAlias() {
      // noop
    };

    ExternalDeclaration.prototype.addReference = function addReference(reference) {
      reference.declaration = this;

      if (this.name === 'default' || this.name === '*') {
        this.module.suggestName(reference.name);
      }
    };

    ExternalDeclaration.prototype.render = function render(es6) {
      if (this.name === '*') {
        return this.module.name;
      }

      if (this.name === 'default') {
        return !es6 && this.module.exportsNames ? this.module.name + '__default' : this.module.name;
      }

      return es6 ? this.name : this.module.name + '.' + this.name;
    };

    ExternalDeclaration.prototype.use = function use() {
      // noop?
    };

    return ExternalDeclaration;
  })();

  var ExternalModule = (function () {
    function ExternalModule(id) {
      babelHelpers_classCallCheck(this, ExternalModule);

      this.id = id;
      this.name = makeLegalIdentifier(id);

      this.nameSuggestions = blank();
      this.mostCommonSuggestion = 0;

      this.isExternal = true;
      this.declarations = blank();

      this.exportsNames = false;
    }

    ExternalModule.prototype.suggestName = function suggestName(name) {
      if (!this.nameSuggestions[name]) this.nameSuggestions[name] = 0;
      this.nameSuggestions[name] += 1;

      if (this.nameSuggestions[name] > this.mostCommonSuggestion) {
        this.mostCommonSuggestion = this.nameSuggestions[name];
        this.name = name;
      }
    };

    ExternalModule.prototype.traceExport = function traceExport(name) {
      if (name !== 'default' && name !== '*') {
        this.exportsNames = true;
      }

      return this.declarations[name] || (this.declarations[name] = new ExternalDeclaration(this, name));
    };

    return ExternalModule;
  })();

  function getName(x) {
    return x.name;
  }

  function quoteId(x) {
    return "'" + x.id + "'";
  }

  function req(x) {
    return "require('" + x.id + "')";
  }

  function getInteropBlock(bundle) {
    return bundle.externalModules.map(function (module) {
      return module.declarations.default ? module.exportsNames ? 'var ' + module.name + '__default = \'default\' in ' + module.name + ' ? ' + module.name + '[\'default\'] : ' + module.name + ';' : module.name + ' = \'default\' in ' + module.name + ' ? ' + module.name + '[\'default\'] : ' + module.name + ';' : null;
    }).filter(Boolean).join('\n');
  }

  function getExportBlock(entryModule, exportMode) {
    var mechanism = arguments.length <= 2 || arguments[2] === undefined ? 'return' : arguments[2];

    if (exportMode === 'default') {
      return mechanism + ' ' + entryModule.declarations.default.render(false) + ';';
    }

    return entryModule.getExports().map(function (name) {
      var prop = name === 'default' ? '[\'default\']' : '.' + name;
      var declaration = entryModule.traceExport(name);

      var lhs = 'exports' + prop;
      var rhs = declaration.render(false);

      // prevent `exports.count = exports.count`
      if (lhs === rhs) return null;

      return lhs + ' = ' + rhs + ';';
    }).filter(Boolean).join('\n');
  }

  function umd(bundle, magicString, _ref, options) {
    var exportMode = _ref.exportMode;
    var indentString = _ref.indentString;

    if (exportMode !== 'none' && !options.moduleName) {
      throw new Error('You must supply options.moduleName for UMD bundles');
    }

    var globalNames = options.globals || blank();

    var amdDeps = bundle.externalModules.map(quoteId);
    var cjsDeps = bundle.externalModules.map(req);
    var globalDeps = bundle.externalModules.map(function (module) {
      return 'global.' + (globalNames[module.id] || module.name);
    });

    var args = bundle.externalModules.map(getName);

    if (exportMode === 'named') {
      amdDeps.unshift('\'exports\'');
      cjsDeps.unshift('exports');
      globalDeps.unshift('(global.' + options.moduleName + ' = {})');

      args.unshift('exports');
    }

    var amdParams = (options.moduleId ? '\'' + options.moduleId + '\', ' : '') + (amdDeps.length ? '[' + amdDeps.join(', ') + '], ' : '');

    var cjsExport = exportMode === 'default' ? 'module.exports = ' : '';
    var defaultExport = exportMode === 'default' ? 'global.' + options.moduleName + ' = ' : '';

    var useStrict = options.useStrict !== false ? ' \'use strict\';' : '';

    var intro = ('(function (global, factory) {\n\t\t\ttypeof exports === \'object\' && typeof module !== \'undefined\' ? ' + cjsExport + 'factory(' + cjsDeps.join(', ') + ') :\n\t\t\ttypeof define === \'function\' && define.amd ? define(' + amdParams + 'factory) :\n\t\t\t' + defaultExport + 'factory(' + globalDeps + ');\n\t\t}(this, function (' + args + ') {' + useStrict + '\n\n\t\t').replace(/^\t\t/gm, '').replace(/^\t/gm, magicString.getIndentString());

    // var foo__default = 'default' in foo ? foo['default'] : foo;
    var interopBlock = getInteropBlock(bundle);
    if (interopBlock) magicString.prepend(interopBlock + '\n\n');

    var exportBlock = getExportBlock(bundle.entryModule, exportMode);
    if (exportBlock) magicString.append('\n\n' + exportBlock);

    return magicString.trim().indent(indentString).append('\n\n}));').prepend(intro);
  }

  function iife(bundle, magicString, _ref, options) {
    var exportMode = _ref.exportMode;
    var indentString = _ref.indentString;

    var globalNames = options.globals || blank();

    var dependencies = bundle.externalModules.map(function (module) {
      return globalNames[module.id] || module.name;
    });

    var args = bundle.externalModules.map(getName);

    if (exportMode !== 'none' && !options.moduleName) {
      throw new Error('You must supply options.moduleName for IIFE bundles');
    }

    if (exportMode === 'named') {
      dependencies.unshift('(this.' + options.moduleName + ' = {})');
      args.unshift('exports');
    }

    var useStrict = options.useStrict !== false ? ' \'use strict\';' : '';
    var intro = '(function (' + args + ') {' + useStrict + '\n\n';
    var outro = '\n\n})(' + dependencies + ');';

    if (exportMode === 'default') {
      intro = 'var ' + options.moduleName + ' = ' + intro;
    }

    // var foo__default = 'default' in foo ? foo['default'] : foo;
    var interopBlock = getInteropBlock(bundle);
    if (interopBlock) magicString.prepend(interopBlock + '\n\n');

    var exportBlock = getExportBlock(bundle.entryModule, exportMode);
    if (exportBlock) magicString.append('\n\n' + exportBlock);

    return magicString.indent(indentString).prepend(intro).append(outro);
  }

  function notDefault(name) {
    return name !== 'default';
  }
  function es6(bundle, magicString) {
    var importBlock = bundle.externalModules.map(function (module) {
      var specifiers = [];
      var importedNames = keys(module.declarations).filter(function (name) {
        return name !== '*' && name !== 'default';
      });

      if (module.declarations.default) {
        specifiers.push(module.name);
      }

      if (module.declarations['*']) {
        specifiers.push('* as ' + module.name);
      }

      if (importedNames.length) {
        specifiers.push('{ ' + importedNames.join(', ') + ' }');
      }

      return specifiers.length ? 'import ' + specifiers.join(', ') + ' from \'' + module.id + '\';' : 'import \'' + module.id + '\';';
    }).join('\n');

    if (importBlock) {
      magicString.prepend(importBlock + '\n\n');
    }

    var module = bundle.entryModule;

    var specifiers = module.getExports().filter(notDefault).map(function (name) {
      var declaration = module.traceExport(name);

      return declaration.name === name ? name : declaration.name + ' as ' + name;
    });

    var exportBlock = specifiers.length ? 'export { ' + specifiers.join(', ') + ' };' : '';

    var defaultExport = module.exports.default || module.reexports.default;
    if (defaultExport) {
      exportBlock += 'export default ' + module.traceExport('default').name + ';';
    }

    if (exportBlock) {
      magicString.append('\n\n' + exportBlock.trim());
    }

    return magicString.trim();
  }

  function cjs(bundle, magicString, _ref, options) {
    var exportMode = _ref.exportMode;

    var intro = options.useStrict === false ? '' : '\'use strict\';\n\n';

    // TODO handle empty imports, once they're supported
    var importBlock = bundle.externalModules.map(function (module) {
      var requireStatement = 'var ' + module.name + ' = require(\'' + module.id + '\');';

      if (module.declarations.default) {
        requireStatement += '\n' + (module.exportsNames ? 'var ' + module.name + '__default = ' : module.name + ' = ') + ('\'default\' in ' + module.name + ' ? ' + module.name + '[\'default\'] : ' + module.name + ';');
      }

      return requireStatement;
    }).join('\n');

    if (importBlock) {
      intro += importBlock + '\n\n';
    }

    magicString.prepend(intro);

    var exportBlock = getExportBlock(bundle.entryModule, exportMode, 'module.exports =');
    if (exportBlock) magicString.append('\n\n' + exportBlock);

    return magicString;
  }

  function amd(bundle, magicString, _ref, options) {
    var exportMode = _ref.exportMode;
    var indentString = _ref.indentString;

    var deps = bundle.externalModules.map(quoteId);
    var args = bundle.externalModules.map(getName);

    if (exportMode === 'named') {
      args.unshift('exports');
      deps.unshift('\'exports\'');
    }

    var params = (options.moduleId ? '\'' + options.moduleId + '\', ' : '') + (deps.length ? '[' + deps.join(', ') + '], ' : '');

    var useStrict = options.useStrict !== false ? ' \'use strict\';' : '';
    var intro = 'define(' + params + 'function (' + args.join(', ') + ') {' + useStrict + '\n\n';

    // var foo__default = 'default' in foo ? foo['default'] : foo;
    var interopBlock = getInteropBlock(bundle);
    if (interopBlock) magicString.prepend(interopBlock + '\n\n');

    var exportBlock = getExportBlock(bundle.entryModule, exportMode);
    if (exportBlock) magicString.append('\n\n' + exportBlock);

    return magicString.indent(indentString).append('\n\n});').prepend(intro);
  }

  var finalisers = { amd: amd, cjs: cjs, es6: es6, iife: iife, umd: umd };

  function ensureArray(thing) {
    if (Array.isArray(thing)) return thing;
    if (thing == undefined) return [];
    return [thing];
  }

  function dirExists(dir) {
    try {
      readdirSync(dir);
      return true;
    } catch (err) {
      return false;
    }
  }

  function defaultResolver(importee, importer, options) {
    // absolute paths are left untouched
    if (isAbsolute(importee)) return importee;

    // if this is the entry point, resolve against cwd
    if (importer === undefined) return resolve(process.cwd(), importee);

    // we try to resolve external modules
    if (importee[0] !== '.') {
      var _importee$split = importee.split(/[\/\\]/);

      var id = _importee$split[0];

      // unless we want to keep it external, that is
      if (~options.external.indexOf(id)) return null;

      return options.resolveExternal(importee, importer, options);
    }

    return resolve(dirname(importer), importee).replace(/\.js$/, '') + '.js';
  }

  function defaultExternalResolver(id, importer) {
    // for now, only node_modules is supported, and only jsnext:main
    var root = absolutePath.exec(importer)[0];
    var dir = dirname(importer);

    // `foo` should use jsnext:main, but `foo/src/bar` shouldn't
    var parts = id.split(/[\/\\]/);

    // npm scoped packages – @user/package
    if (parts[0][0] === '@' && parts[1]) {
      var user = parts.shift();
      parts[0] = user + '/' + parts[0];
    }

    while (dir !== root && dir !== '.') {
      var modulePath = resolve(dir, 'node_modules', parts[0]);

      if (dirExists(modulePath)) {
        // `foo/src/bar`
        if (parts.length > 1) {
          return resolve.apply(undefined, [modulePath].concat(babelHelpers_toConsumableArray(parts.slice(1)))).replace(/\.js$/, '') + '.js';
        }

        // `foo`
        var pkgPath = resolve(modulePath, 'package.json');
        var pkg = undefined;

        try {
          pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        } catch (err) {
          throw new Error('Missing or malformed package.json: ' + modulePath);
        }

        var main = pkg['jsnext:main'];

        if (!main) {
          throw new Error('Package ' + id + ' (imported by ' + importer + ') does not have a jsnext:main field, and so cannot be included in your rollup. Try adding it as an external module instead (e.g. options.external = [\'' + id + '\']). See https://github.com/rollup/rollup/wiki/jsnext:main for more info');
        }

        return resolve(dirname(pkgPath), main).replace(/\.js$/, '') + '.js';
      }

      dir = dirname(dir);
    }

    throw new Error('Could not find package ' + id + ' (required by ' + importer + ')');
  }

  function defaultLoader(id) {
    return readFileSync(id, 'utf-8');
  }

  function badExports(option, keys) {
    throw new Error('\'' + option + '\' was specified for options.exports, but entry module has following exports: ' + keys.join(', '));
  }
  function getExportMode(bundle, exportMode) {
    var exportKeys = keys(bundle.entryModule.exports).concat(keys(bundle.entryModule.reexports)).concat(bundle.entryModule.exportAllSources); // not keys, but makes our job easier this way

    if (exportMode === 'default') {
      if (exportKeys.length !== 1 || exportKeys[0] !== 'default') {
        badExports('default', exportKeys);
      }
    } else if (exportMode === 'none' && exportKeys.length) {
      badExports('none', exportKeys);
    }

    if (!exportMode || exportMode === 'auto') {
      if (exportKeys.length === 0) {
        exportMode = 'none';
      } else if (exportKeys.length === 1 && exportKeys[0] === 'default') {
        exportMode = 'default';
      } else {
        exportMode = 'named';
      }
    }

    if (!/(?:default|named|none)/.test(exportMode)) {
      throw new Error('options.exports must be \'default\', \'named\', \'none\', \'auto\', or left unspecified (defaults to \'auto\')');
    }

    return exportMode;
  }

  function getIndentString(magicString, options) {
    if (!('indent' in options) || options.indent === true) {
      return magicString.getIndentString();
    }

    return options.indent || '';
  }

  function unixizePath(path) {
    return path.split(/[\/\\]/).join('/');
  }

  function transform(source, id, transformers) {
    var sourceMapChain = [];

    if (typeof source === 'string') {
      source = {
        code: source,
        ast: null
      };
    }

    var originalCode = source.code;
    var ast = source.ast;

    var code = transformers.reduce(function (previous, transformer) {
      var result = transformer(previous, id);

      if (result == null) return previous;

      if (typeof result === 'string') {
        result = {
          code: result,
          ast: null,
          map: null
        };
      }

      sourceMapChain.push(result.map);
      ast = result.ast;

      return result.code;
    }, source.code);

    return { code: code, originalCode: originalCode, ast: ast, sourceMapChain: sourceMapChain };
  }

  function decodeSegments(encodedSegments) {
    var i = encodedSegments.length;
    var segments = new Array(i);

    while (i--) segments[i] = decode$1(encodedSegments[i]);
    return segments;
  }

  function decode(mappings) {
    var sourceFileIndex = 0; // second field
    var sourceCodeLine = 0; // third field
    var sourceCodeColumn = 0; // fourth field
    var nameIndex = 0; // fifth field

    var lines = mappings.split(';');
    var numLines = lines.length;
    var decoded = new Array(numLines);

    var i = undefined;
    var j = undefined;
    var line = undefined;
    var generatedCodeColumn = undefined;
    var decodedLine = undefined;
    var segments = undefined;
    var segment = undefined;
    var result = undefined;

    for (i = 0; i < numLines; i += 1) {
      line = lines[i];

      generatedCodeColumn = 0; // first field - reset each time
      decodedLine = [];

      segments = decodeSegments(line.split(','));

      for (j = 0; j < segments.length; j += 1) {
        segment = segments[j];

        if (!segment.length) {
          break;
        }

        generatedCodeColumn += segment[0];

        result = [generatedCodeColumn];
        decodedLine.push(result);

        if (segment.length === 1) {
          // only one field!
          break;
        }

        sourceFileIndex += segment[1];
        sourceCodeLine += segment[2];
        sourceCodeColumn += segment[3];

        result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn);

        if (segment.length === 5) {
          nameIndex += segment[4];
          result.push(nameIndex);
        }
      }

      decoded[i] = decodedLine;
    }

    return decoded;
  }

  function encode(decoded) {
    var offsets = {
      generatedCodeColumn: 0,
      sourceFileIndex: 0, // second field
      sourceCodeLine: 0, // third field
      sourceCodeColumn: 0, // fourth field
      nameIndex: 0 // fifth field
    };

    return decoded.map(function (line) {
      offsets.generatedCodeColumn = 0; // first field - reset each time
      return line.map(encodeSegment).join(',');
    }).join(';');

    function encodeSegment(segment) {
      if (!segment.length) {
        return segment;
      }

      var result = new Array(segment.length);

      result[0] = segment[0] - offsets.generatedCodeColumn;
      offsets.generatedCodeColumn = segment[0];

      if (segment.length === 1) {
        // only one field!
        return result;
      }

      result[1] = segment[1] - offsets.sourceFileIndex;
      result[2] = segment[2] - offsets.sourceCodeLine;
      result[3] = segment[3] - offsets.sourceCodeColumn;

      offsets.sourceFileIndex = segment[1];
      offsets.sourceCodeLine = segment[2];
      offsets.sourceCodeColumn = segment[3];

      if (segment.length === 5) {
        result[4] = segment[4] - offsets.nameIndex;
        offsets.nameIndex = segment[4];
      }

      return encode$1(result);
    }
  }

  function traceSegment(loc, mappings) {
    var line = loc[0];
    var column = loc[1];

    var segments = mappings[line];

    if (!segments) return null;

    for (var i = 0; i < segments.length; i += 1) {
      var segment = segments[i];

      if (segment[0] > column) return null;

      if (segment[0] === column) {
        if (segment[1] !== 0) {
          throw new Error('Bad sourcemap');
        }

        return [segment[2], segment[3]];
      }
    }

    return null;
  }
  function collapseSourcemaps(map, modules) {
    var chains = modules.map(function (module) {
      return module.sourceMapChain.map(function (map) {
        return decode(map.mappings);
      });
    });

    var decodedMappings = decode(map.mappings);

    var tracedMappings = decodedMappings.map(function (line) {
      var tracedLine = [];

      line.forEach(function (segment) {
        var sourceIndex = segment[1];
        var sourceCodeLine = segment[2];
        var sourceCodeColumn = segment[3];

        var chain = chains[sourceIndex];

        var i = chain.length;
        var traced = [sourceCodeLine, sourceCodeColumn];

        while (i-- && traced) {
          traced = traceSegment(traced, chain[i]);
        }

        if (traced) {
          tracedLine.push([segment[0], segment[1], traced[0], traced[1]
          // TODO name?
          ]);
        }
      });

      return tracedLine;
    });

    map.sourcesContent = modules.map(function (module) {
      return module.originalCode;
    });
    map.mappings = encode(tracedMappings);
    return map;
  }

  var Bundle = (function () {
    function Bundle(options) {
      var _this = this;

      babelHelpers_classCallCheck(this, Bundle);

      this.entry = options.entry;
      this.entryModule = null;

      this.resolveId = first$1(ensureArray(options.resolveId).concat(defaultResolver));
      this.load = first$1(ensureArray(options.load).concat(defaultLoader));

      this.resolveOptions = {
        external: ensureArray(options.external),
        resolveExternal: first$1(ensureArray(options.resolveExternal).concat(defaultExternalResolver))
      };

      this.loadOptions = {};
      this.transformers = ensureArray(options.transform);

      this.pending = blank();
      this.moduleById = blank();
      this.modules = [];

      this.externalModules = [];
      this.internalNamespaces = [];

      this.assumedGlobals = blank();

      // TODO strictly speaking, this only applies with non-ES6, non-default-only bundles
      ['module', 'exports'].forEach(function (global) {
        return _this.assumedGlobals[global] = true;
      });
    }

    Bundle.prototype.build = function build() {
      var _this2 = this;

      return Promise$1.resolve(this.resolveId(this.entry, undefined, this.resolveOptions)).then(function (id) {
        return _this2.fetchModule(id);
      }).then(function (entryModule) {
        _this2.entryModule = entryModule;

        _this2.modules.forEach(function (module) {
          return module.bindImportSpecifiers();
        });
        _this2.modules.forEach(function (module) {
          return module.bindAliases();
        });
        _this2.modules.forEach(function (module) {
          return module.bindReferences();
        });

        // mark all export statements
        entryModule.getExports().forEach(function (name) {
          var declaration = entryModule.traceExport(name);
          declaration.isExported = true;

          if (declaration.statement) declaration.use();
        });

        var settled = false;
        while (!settled) {
          settled = true;

          _this2.modules.forEach(function (module) {
            if (module.markAllSideEffects()) settled = false;
          });
        }

        _this2.orderedModules = _this2.sort();
        _this2.deconflict();
      });
    };

    Bundle.prototype.deconflict = function deconflict() {
      var used = blank();

      // ensure no conflicts with globals
      keys(this.assumedGlobals).forEach(function (name) {
        return used[name] = 1;
      });

      function getSafeName(name) {
        if (used[name]) {
          return name + '$' + used[name]++;
        }

        used[name] = 1;
        return name;
      }

      this.externalModules.forEach(function (module) {
        module.name = getSafeName(module.name);
      });

      this.modules.forEach(function (module) {
        keys(module.declarations).forEach(function (originalName) {
          var declaration = module.declarations[originalName];

          if (originalName === 'default') {
            if (declaration.original && !declaration.original.isReassigned) return;
          }

          declaration.name = getSafeName(declaration.name);
        });
      });
    };

    Bundle.prototype.fetchModule = function fetchModule(id) {
      var _this3 = this;

      // short-circuit cycles
      if (this.pending[id]) return null;
      this.pending[id] = true;

      return Promise$1.resolve(this.load(id, this.loadOptions)).then(function (source) {
        return transform(source, id, _this3.transformers);
      }).then(function (source) {
        var code = source.code;
        var originalCode = source.originalCode;
        var ast = source.ast;
        var sourceMapChain = source.sourceMapChain;

        var module = new Module({ id: id, code: code, originalCode: originalCode, ast: ast, sourceMapChain: sourceMapChain, bundle: _this3 });

        _this3.modules.push(module);
        _this3.moduleById[id] = module;

        return _this3.fetchAllDependencies(module).then(function () {
          return module;
        });
      });
    };

    Bundle.prototype.fetchAllDependencies = function fetchAllDependencies(module) {
      var _this4 = this;

      var promises = module.dependencies.map(function (source) {
        return Promise$1.resolve(_this4.resolveId(source, module.id, _this4.resolveOptions)).then(function (resolvedId) {
          module.resolvedIds[source] = resolvedId || source;

          // external module
          if (!resolvedId) {
            if (!_this4.moduleById[source]) {
              var _module = new ExternalModule(source);
              _this4.externalModules.push(_module);
              _this4.moduleById[source] = _module;
            }
          } else if (resolvedId === module.id) {
            throw new Error('A module cannot import itself (' + resolvedId + ')');
          } else {
            return _this4.fetchModule(resolvedId);
          }
        });
      });

      return Promise$1.all(promises);
    };

    Bundle.prototype.render = function render() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var format = options.format || 'es6';

      // Determine export mode - 'default', 'named', 'none'
      var exportMode = getExportMode(this, options.exports);

      var magicString = new MagicString.Bundle({ separator: '\n\n' });
      var usedModules = [];

      this.orderedModules.forEach(function (module) {
        var source = module.render(format === 'es6');
        if (source.toString().length) {
          magicString.addSource(source);
          usedModules.push(module);
        }
      });

      if (options.intro) magicString.prepend(options.intro + '\n');
      if (options.outro) magicString.append('\n' + options.outro);

      var indentString = getIndentString(magicString, options);

      var finalise = finalisers[format];
      if (!finalise) throw new Error('You must specify an output type - valid options are ' + keys(finalisers).join(', '));

      magicString = finalise(this, magicString.trim(), { exportMode: exportMode, indentString: indentString }, options);

      if (options.banner) magicString.prepend(options.banner + '\n');
      if (options.footer) magicString.append('\n' + options.footer);

      var code = magicString.toString();
      var map = null;

      if (options.sourceMap) {
        var file = options.sourceMapFile || options.dest;
        map = magicString.generateMap({
          includeContent: true,
          file: file
          // TODO
        });

        if (this.transformers.length) map = collapseSourcemaps(map, usedModules);
        map.sources = map.sources.map(unixizePath);
      }

      return { code: code, map: map };
    };

    Bundle.prototype.sort = function sort() {
      var seen = {};
      var ordered = [];
      var hasCycles = undefined;

      var strongDeps = {};
      var stronglyDependsOn = {};

      function visit(module) {
        if (seen[module.id]) return;
        seen[module.id] = true;

        var _module$consolidateDependencies = module.consolidateDependencies();

        var strongDependencies = _module$consolidateDependencies.strongDependencies;
        var weakDependencies = _module$consolidateDependencies.weakDependencies;

        strongDeps[module.id] = [];
        stronglyDependsOn[module.id] = {};

        keys(strongDependencies).forEach(function (id) {
          var imported = strongDependencies[id];

          strongDeps[module.id].push(imported);

          if (seen[id]) {
            // we need to prevent an infinite loop, and note that
            // we need to check for strong/weak dependency relationships
            hasCycles = true;
            return;
          }

          visit(imported);
        });

        keys(weakDependencies).forEach(function (id) {
          var imported = weakDependencies[id];

          if (seen[id]) {
            // we need to prevent an infinite loop, and note that
            // we need to check for strong/weak dependency relationships
            hasCycles = true;
            return;
          }

          visit(imported);
        });

        // add second (and third...) order dependencies
        function addStrongDependencies(dependency) {
          if (stronglyDependsOn[module.id][dependency.id]) return;

          stronglyDependsOn[module.id][dependency.id] = true;
          strongDeps[dependency.id].forEach(addStrongDependencies);
        }

        strongDeps[module.id].forEach(addStrongDependencies);

        ordered.push(module);
      }

      this.modules.forEach(visit);

      if (hasCycles) {
        var unordered = ordered;
        ordered = [];

        // unordered is actually semi-ordered, as [ fewer dependencies ... more dependencies ]
        unordered.forEach(function (module) {
          // ensure strong dependencies of `module` that don't strongly depend on `module` go first
          strongDeps[module.id].forEach(place);

          function place(dep) {
            if (!stronglyDependsOn[dep.id][module.id] && ! ~ordered.indexOf(dep)) {
              strongDeps[dep.id].forEach(place);
              ordered.push(dep);
            }
          }

          if (! ~ordered.indexOf(module)) {
            ordered.push(module);
          }
        });
      }

      return ordered;
    };

    return Bundle;
  })();

  var VERSION = '0.19.1';

  function rollup(options) {
    if (!options || !options.entry) {
      throw new Error('You must supply options.entry to rollup');
    }

    var bundle = new Bundle(options);

    return bundle.build().then(function () {
      return {
        imports: bundle.externalModules.map(function (module) {
          return module.id;
        }),
        exports: keys(bundle.entryModule.exports),
        modules: bundle.orderedModules.map(function (module) {
          return { id: module.id };
        }),

        generate: function (options) {
          return bundle.render(options);
        },
        write: function (options) {
          if (!options || !options.dest) {
            throw new Error('You must supply options.dest to bundle.write');
          }

          var dest = options.dest;

          var _bundle$render = bundle.render(options);

          var code = _bundle$render.code;
          var map = _bundle$render.map;

          var promises = [];

          if (options.sourceMap) {
            var url = undefined;

            if (options.sourceMap === 'inline') {
              url = map.toUrl();
            } else {
              url = _basename(dest) + '.map';
              promises.push(writeFile(dest + '.map', map.toString()));
            }

            code += '\n//# ' + SOURCEMAPPING_URL$1 + '=' + url;
          }

          promises.push(writeFile(dest, code));
          return Promise.all(promises);
        }
      };
    });
  }

  exports.rollup = rollup;
  exports.VERSION = VERSION;

}));
//# sourceMappingURL=rollup.browser.js.map
