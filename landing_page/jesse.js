/* Pixel Jesse out for a stroll along the bottom of the page, walking like an
   SNES Final Fantasy character. The sprite sheet (jesse-walk.png) is a
   side-view walk drawn to match his chibi sprite on lumarie.family (same
   palette and proportions). Clicking him heads to lumarie.family. */
(function () {
  'use strict';

  /* jesse-walk.png: full alternating gait of 8 frames side by side
     (contact, recoil, passing, reach, then the mirror step), each 22x43
     logical pixels, drawn facing right, plus a 9th front-facing standing
     frame shown on hover. Arms counter-swing once per cycle and the body
     dips 1px on each footfall. */
  var FRAME_COLS = 22;
  var FRAME_ROWS = 43;
  var FRAME_COUNT = 8;   // walk-cycle frames
  var SHEET_FRAMES = 9;  // walk cycle + front-facing hover frame
  var SCALE = 3;
  var W = FRAME_COLS * SCALE;
  var H = FRAME_ROWS * SCALE;
  /* px per second, matched to the planted foot's 2.5px/frame backward march
     in the sheet (8fps, 3x scale) so feet grip the ground instead of skating */
  var SPEED = 60;

  function init() {
    var link = document.createElement('a');
    link.className = 'jesse-walk';
    link.href = 'https://lumarie.family';
    link.setAttribute('aria-label', 'Pixel Jesse out for a walk — follow him to lumarie.family');
    link.title = 'lumarie.family';

    var flip = document.createElement('div');
    flip.className = 'jesse-flip';
    var sprite = document.createElement('div');
    sprite.className = 'jesse-sprite';
    flip.appendChild(sprite);
    link.appendChild(flip);

    var style = document.createElement('style');
    style.textContent =
      '.jesse-walk{position:fixed;left:0;bottom:0;z-index:59;display:block;' +
      'width:' + W + 'px;height:' + H + 'px;' +
      /* start offscreen right and wait a beat before the first stroll; walking
         leftward first keeps him out of phase with the moogle */
      'transform:translateX(100vw);' +
      'animation:jesse-cross 30s linear infinite alternate;' +
      'animation-delay:3s;}' +
      '.jesse-walk:hover,.jesse-walk:focus-visible{animation-play-state:paused;}' +
      '.jesse-walk:hover .jesse-flip,.jesse-walk:focus-visible .jesse-flip,' +
      '.jesse-walk:hover .jesse-sprite,.jesse-walk:focus-visible .jesse-sprite{animation-play-state:paused;}' +
      /* on hover he stops and turns to face you: the !important declarations
         beat the (paused) animation values, swapping in the unmirrored
         front-facing 9th frame; releasing resumes the walk mid-stride */
      '.jesse-walk:hover .jesse-flip,.jesse-walk:focus-visible .jesse-flip{transform:scaleX(1)!important;}' +
      '.jesse-walk:hover .jesse-sprite,.jesse-walk:focus-visible .jesse-sprite{' +
      'background-position-x:-' + (W * FRAME_COUNT) + 'px!important;}' +
      '.jesse-walk:focus-visible{outline:2px solid #3272a3;outline-offset:2px;}' +
      /* sprite art faces right; face left on the outbound (right-to-left) leg,
         right on the return; period is exactly twice the crossing so the two
         animations stay phase-locked forever */
      '.jesse-flip{width:100%;height:100%;' +
      'animation:jesse-face 60s linear infinite;animation-delay:3s;}' +
      '@keyframes jesse-face{0%,49.999%{transform:scaleX(-1);}' +
      '50%,100%{transform:scaleX(1);}}' +
      '.jesse-sprite{width:100%;height:100%;' +
      'background-image:url(jesse-walk.png?v=12);' +
      'background-size:' + (W * SHEET_FRAMES) + 'px ' + H + 'px;' +
      'background-repeat:no-repeat;image-rendering:pixelated;' +
      'animation:jesse-step 1s steps(' + FRAME_COUNT + ') infinite;}' +
      '@keyframes jesse-cross{from{transform:translateX(100vw);}' +
      'to{transform:translateX(-' + (W + 10) + 'px);}}' +
      '@keyframes jesse-step{from{background-position-x:0;}' +
      'to{background-position-x:-' + (W * FRAME_COUNT) + 'px;}}' +
      '@media (prefers-reduced-motion: reduce){' +
      '.jesse-walk,.jesse-flip,.jesse-sprite{animation:none;}' +
      '.jesse-walk{left:12px;transform:none;}' +
      /* no walk to animate, so just stand there facing the room */
      '.jesse-sprite{background-position-x:-' + (W * FRAME_COUNT) + 'px;}}';

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
