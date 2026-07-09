/* A moogle (kupo!) that walks across the bottom of the page, FFVI-style.
   Clicking it heads to the FFVII menu at /ffvii. Self-contained: draws its
   own pixel sprite on a canvas and injects its own styles. */
(function () {
  'use strict';

  var PALETTE = {
    O: '#2a2138', // outline
    W: '#f6f1e4', // fur
    S: '#cfc2d8', // fur shade
    P: '#f47ba4', // nose / inner-ear pink
    D: '#c2517e', // pink shade
    R: '#de4453', // pom-pom red
    E: '#a32e40', // pom shade
    V: '#a06cb4', // wing
    U: '#71487f'  // wing shade
  };

  /* 24x26 pixel frames, walking right ('.' = transparent) */
  var FRAMES = [
    [
      '............OO..........',
      '...........ORRO.........',
      '..........ORRRRO........',
      '..........ORRREO........',
      '...........OREO.........',
      '........OO..OO..OO......',
      '.......OWWO..O.OWWO.....',
      '.......OPWO..O.OWPO.....',
      '.......OWWOOOOOOWWO.....',
      '......OSWWWWWWWWWWO.....',
      '.....OSWWWWWWWWWWWWO....',
      '....OSWWWWWWWWWWWWWWO...',
      '..OOOSWWWOWWWWWWOWWWO...',
      '.OVVOSWWWOWWPPPWOWWWO...',
      '.OVVOSWWWWWWPDDWWWWWO...',
      'OVVUOSWWWWWWWWWWWWWWO...',
      'OVUUUOSWWWWWWWWWWWWO....',
      '.OOUUUOSWWWWWWWWWWO.....',
      '...OOOOOSWWWWWWWWO......',
      '......OSWWWWWWWWWWO.....',
      '......OSWWWWWWWWWWO.....',
      '......OSWWWWWWWWWWO.....',
      '.......OSWWWWWWWWO......',
      '.........OWO..OWO.......',
      '........OWWO..OWWO......',
      '........OOOO..OOOO......'
    ],
    [
      '........................',
      '............OO..........',
      '...........ORRO.........',
      '..........ORRRRO........',
      '..........ORRREO........',
      '...........OREO.........',
      '........OO..OO..OO......',
      '.......OWWO..O.OWWO.....',
      '.......OPWO..O.OWPO.....',
      '.......OWWOOOOOOWWO.....',
      '......OSWWWWWWWWWWO.....',
      '.....OSWWWWWWWWWWWWO....',
      '....OSWWWWWWWWWWWWWWO...',
      '..OOOSWWWOWWWWWWOWWWO...',
      '.OVVOSWWWOWWPPPWOWWWO...',
      '.OVVOSWWWWWWPDDWWWWWO...',
      'OVVUOSWWWWWWWWWWWWWWO...',
      'OVUUUOSWWWWWWWWWWWWO....',
      '.OOUUUOSWWWWWWWWWWO.....',
      '...OOOOOSWWWWWWWWO......',
      '......OSWWWWWWWWWWO.....',
      '......OSWWWWWWWWWWO.....',
      '.......OSWWWWWWWWO......',
      '........OSWWWWWWO.......',
      '...........OWWO.........',
      '...........OOOO.........'
    ]
  ];

  var COLS = FRAMES[0][0].length;
  var ROWS = FRAMES[0].length;
  var SCALE = 3;
  var W = COLS * SCALE;
  var H = ROWS * SCALE;
  var SPEED = 55; // px per second

  function drawSheet() {
    var canvas = document.createElement('canvas');
    canvas.width = COLS * FRAMES.length;
    canvas.height = ROWS;
    var ctx = canvas.getContext('2d');
    FRAMES.forEach(function (frame, f) {
      frame.forEach(function (row, y) {
        for (var x = 0; x < row.length; x++) {
          var color = PALETTE[row[x]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(f * COLS + x, y, 1, 1);
        }
      });
    });
    return canvas.toDataURL('image/png');
  }

  function init() {
    var link = document.createElement('a');
    link.className = 'moogle-walk';
    link.href = '/ffvii';
    link.setAttribute('aria-label', 'A moogle! Follow it to the FFVII menu, kupo');
    link.title = 'Kupo!';

    var flip = document.createElement('div');
    flip.className = 'moogle-flip';
    var sprite = document.createElement('div');
    sprite.className = 'moogle-sprite';
    flip.appendChild(sprite);
    link.appendChild(flip);

    var style = document.createElement('style');
    style.textContent =
      '.moogle-walk{position:fixed;left:0;bottom:0;z-index:60;display:block;' +
      'width:' + W + 'px;height:' + H + 'px;' +
      /* start offscreen and wait a beat before the first stroll */
      'transform:translateX(-' + (W + 10) + 'px);' +
      'animation:moogle-cross 30s linear infinite alternate;' +
      'animation-delay:7s;}' +
      '.moogle-walk:hover,.moogle-walk:focus-visible{animation-play-state:paused;}' +
      '.moogle-walk:hover .moogle-flip,.moogle-walk:focus-visible .moogle-flip,' +
      '.moogle-walk:hover .moogle-sprite,.moogle-walk:focus-visible .moogle-sprite{animation-play-state:paused;}' +
      '.moogle-walk:focus-visible{outline:2px solid ' + PALETTE.P + ';outline-offset:2px;}' +
      /* faces right on the outbound leg, left on the return; period is exactly
         twice the crossing so the two animations stay phase-locked forever */
      '.moogle-flip{width:100%;height:100%;' +
      'animation:moogle-face 60s linear infinite;animation-delay:7s;}' +
      '@keyframes moogle-face{0%,49.999%{transform:scaleX(1);}' +
      '50%,100%{transform:scaleX(-1);}}' +
      '.moogle-sprite{width:100%;height:100%;' +
      'background-image:url(' + drawSheet() + ');' +
      'background-size:' + (W * FRAMES.length) + 'px ' + H + 'px;' +
      'background-repeat:no-repeat;image-rendering:pixelated;' +
      'animation:moogle-step .55s steps(' + FRAMES.length + ') infinite;}' +
      '@keyframes moogle-cross{from{transform:translateX(-' + (W + 10) + 'px);}' +
      'to{transform:translateX(100vw);}}' +
      '@keyframes moogle-step{from{background-position-x:0;}' +
      'to{background-position-x:-' + (W * FRAMES.length) + 'px;}}' +
      '@media (prefers-reduced-motion: reduce){' +
      '.moogle-walk,.moogle-flip,.moogle-sprite{animation:none;}' +
      '.moogle-walk{left:auto;right:12px;}}';

    function setDuration() {
      var distance = window.innerWidth + W + 10;
      var crossing = distance / SPEED;
      link.style.animationDuration = crossing.toFixed(2) + 's';
      flip.style.animationDuration = (crossing * 2).toFixed(2) + 's';
    }
    setDuration();
    window.addEventListener('resize', setDuration);

    document.head.appendChild(style);
    document.body.appendChild(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
