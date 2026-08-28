/* A dependency-free WebGL brass pull chain with 2D constrained physics. */
(function () {
  'use strict';

  var STORAGE_KEY = 'jl-theme';
  var PULL_THRESHOLD = 26;
  var CANVAS_WIDTH = 160;
  var CANVAS_HEIGHT = 140;
  var ANCHOR_X = 100;
  var CHAIN_SEGMENTS = 12;
  var SEGMENT_LENGTH = 5.4;
  var REST_LENGTH = CHAIN_SEGMENTS * SEGMENT_LENGTH;
  var MAX_PAYOUT = 14;
  var FIXED_STEP = 1 / 120;
  var GRAVITY = 1250;

  function resolveTheme(storedTheme, prefersDark) {
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
    return prefersDark ? 'dark' : 'light';
  }

  function shouldToggleFromPull(deltaX, deltaY) {
    return Math.hypot(deltaX, deltaY) >= PULL_THRESHOLD;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      resolveTheme: resolveTheme,
      shouldToggleFromPull: shouldToggleFromPull
    };
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function createRenderer(canvas) {
    var gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true
    });
    if (!gl) return null;

    var vertexSource = [
      'attribute vec2 a_position;',
      'attribute float a_size;',
      'attribute float a_kind;',
      'uniform vec2 u_resolution;',
      'uniform float u_scale;',
      'varying float v_kind;',
      'void main() {',
      '  vec2 size = u_resolution / u_scale;',
      '  vec2 clip = vec2((a_position.x / size.x) * 2.0 - 1.0, 1.0 - (a_position.y / size.y) * 2.0);',
      '  gl_Position = vec4(clip, 0.0, 1.0);',
      '  gl_PointSize = a_size * u_scale;',
      '  v_kind = a_kind;',
      '}'
    ].join('\n');
    var fragmentSource = [
      'precision highp float;',
      'varying float v_kind;',
      'uniform float u_dark;',
      'void main() {',
      '  vec2 p = gl_PointCoord * 2.0 - 1.0;',
      '  float radius = length(p);',
      '  float alpha = 1.0 - smoothstep(0.78, 1.0, radius);',
      '  float light = clamp(0.60 - p.x * 0.30 - p.y * 0.24, 0.0, 1.0);',
      '  vec3 shadow = vec3(0.31, 0.19, 0.045);',
      '  vec3 body = vec3(0.78, 0.56, 0.16);',
      '  vec3 highlight = vec3(1.0, 0.86, 0.48);',
      '  vec3 color = mix(shadow, body, light);',
      '  color = mix(color, highlight, pow(max(0.0, 1.0 - length(p - vec2(-0.34, -0.34)) * 2.0), 3.0));',
      '  color *= mix(1.0, 1.08, u_dark);',
      '  color = mix(color, shadow, smoothstep(0.76, 0.96, radius) * 0.58);',
      '  if (v_kind > 0.5) {',
      '    color = mix(color, highlight, 0.08);',
      '    alpha = 1.0 - smoothstep(0.86, 1.0, radius);',
      '  }',
      '  gl_FragColor = vec4(color * alpha, alpha);',
      '}'
    ].join('\n');

    function compile(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.useProgram(program);

    var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    var position = gl.getAttribLocation(program, 'a_position');
    var size = gl.getAttribLocation(program, 'a_size');
    var kind = gl.getAttribLocation(program, 'a_kind');
    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(size);
    gl.enableVertexAttribArray(kind);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(size, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.vertexAttribPointer(kind, 1, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    var resolution = gl.getUniformLocation(program, 'u_resolution');
    var scale = gl.getUniformLocation(program, 'u_scale');
    var dark = gl.getUniformLocation(program, 'u_dark');
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.round(canvas.clientWidth * dpr);
      var height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      return dpr;
    }

    return function render(points, isDark) {
      var dpr = resize();
      var data = [];
      for (var i = 0; i < points.length; i++) {
        data.push(points[i].x, points[i].y, i === 0 ? 3.1 : 4.0, 0);
      }
      var bob = points[points.length - 1];
      data.push(bob.x, bob.y + 1.2, 13.2, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(scale, dpr);
      gl.uniform1f(dark, isDark ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, points.length + 1);
    };
  }

  var audioContext = null;
  var clickNoiseBuffer = null;

  function playSwitchClick() {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContextClass();
        clickNoiseBuffer = null;
      }

      function trigger() {
        var now = audioContext.currentTime + 0.002;
        var master = audioContext.createGain();
        master.gain.setValueAtTime(0.72, now);
        master.connect(audioContext.destination);

        var snap = audioContext.createOscillator();
        var snapGain = audioContext.createGain();
        snap.type = 'triangle';
        snap.frequency.setValueAtTime(1450, now);
        snap.frequency.exponentialRampToValueAtTime(360, now + 0.032);
        snapGain.gain.setValueAtTime(0.0001, now);
        snapGain.gain.exponentialRampToValueAtTime(0.055, now + 0.0015);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);
        snap.connect(snapGain);
        snapGain.connect(master);
        snap.start(now);
        snap.stop(now + 0.052);

        var thunk = audioContext.createOscillator();
        var thunkGain = audioContext.createGain();
        thunk.type = 'sine';
        thunk.frequency.setValueAtTime(190, now);
        thunk.frequency.exponentialRampToValueAtTime(105, now + 0.055);
        thunkGain.gain.setValueAtTime(0.028, now);
        thunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        thunk.connect(thunkGain);
        thunkGain.connect(master);
        thunk.start(now);
        thunk.stop(now + 0.065);

        if (!clickNoiseBuffer) {
          clickNoiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.026), audioContext.sampleRate);
          var samples = clickNoiseBuffer.getChannelData(0);
          for (var i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        }
        var noise = audioContext.createBufferSource();
        var noiseFilter = audioContext.createBiquadFilter();
        var noiseGain = audioContext.createGain();
        noise.buffer = clickNoiseBuffer;
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2300, now);
        noiseFilter.Q.setValueAtTime(0.8, now);
        noiseGain.gain.setValueAtTime(0.032, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(master);
        noise.start(now);
      }

      if (audioContext.state === 'suspended') {
        var resumed = audioContext.resume();
        if (resumed && resumed.then) resumed.then(trigger, function () {});
        else trigger();
      } else {
        trigger();
      }
    } catch (error) {
      /* Audio is an enhancement; theme switching must remain reliable without it. */
    }
  }

  function init() {
    var control = document.querySelector('.lamp-pull');
    if (!control) return;

    var canvas = control.querySelector('.lamp-pull__canvas');
    var render = createRenderer(canvas);
    var root = document.documentElement;
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var storedTheme = null;
    var theme;
    var points = [];
    var segmentLength = SEGMENT_LENGTH;
    var dragTarget = null;
    var dragging = false;
    var activePointer = null;
    var pointerStart = { x: 0, y: 0 };
    var bobStart = { x: ANCHOR_X, y: REST_LENGTH };
    var pullDelta = { x: 0, y: 0 };
    var pointerVelocity = { x: 0, y: 0 };
    var lastPointerSample = null;
    var pointerMoved = false;
    var allowPointerClick = false;
    var suppressClick = false;
    var animationFrame = null;
    var lastFrameTime = 0;
    var accumulator = 0;
    var settleUntil = 0;
    var introActive = false;

    try { storedTheme = localStorage.getItem(STORAGE_KEY); } catch (error) {}
    theme = resolveTheme(storedTheme, themeQuery.matches);

    function resetChain() {
      points = [];
      for (var i = 0; i <= CHAIN_SEGMENTS; i++) {
        points.push({
          x: ANCHOR_X,
          y: i * SEGMENT_LENGTH,
          oldX: ANCHOR_X,
          oldY: i * SEGMENT_LENGTH
        });
      }
      segmentLength = SEGMENT_LENGTH;
      dragTarget = null;
      draw();
    }

    function applyTheme(nextTheme, persist) {
      theme = nextTheme;
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      control.setAttribute('aria-pressed', String(theme === 'dark'));
      control.setAttribute('aria-label', theme === 'dark' ?
        'Pull chain to turn on the lights' : 'Pull chain to turn off the lights');
      if (persist) {
        storedTheme = theme;
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (error) {}
      }
      draw();
    }

    function draw() {
      if (!points.length) return;
      var bob = points[points.length - 1];
      var dx = bob.x - ANCHOR_X;
      var dy = bob.y;
      control.style.setProperty('--anchor-x', ANCHOR_X + 'px');
      control.style.setProperty('--bob-x', bob.x.toFixed(2) + 'px');
      control.style.setProperty('--bob-y', bob.y.toFixed(2) + 'px');
      control.style.setProperty('--focus-x', (bob.x - 50).toFixed(2) + 'px');
      control.style.setProperty('--chain-length', Math.hypot(dx, dy).toFixed(2) + 'px');
      control.style.setProperty('--chain-angle', Math.atan2(-dx, dy) + 'rad');
      if (render) render(points, theme === 'dark');
    }

    function solveConstraints(iterations) {
      var last = points.length - 1;
      for (var pass = 0; pass < iterations; pass++) {
        points[0].x = ANCHOR_X;
        points[0].y = 0;
        if (dragging && dragTarget) {
          points[last].x = dragTarget.x;
          points[last].y = dragTarget.y;
        }

        for (var i = 0; i < last; i++) {
          var a = points[i];
          var b = points[i + 1];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var distance = Math.hypot(dx, dy) || 0.0001;
          var correction = (distance - segmentLength) / distance;
          var aFixed = i === 0;
          var bFixed = dragging && i + 1 === last;

          if (aFixed) {
            b.x -= dx * correction;
            b.y -= dy * correction;
          } else if (bFixed) {
            a.x += dx * correction;
            a.y += dy * correction;
          } else {
            var half = correction * 0.5;
            a.x += dx * half;
            a.y += dy * half;
            b.x -= dx * half;
            b.y -= dy * half;
          }
        }
      }
      points[0].x = ANCHOR_X;
      points[0].y = 0;
      if (dragging && dragTarget) {
        points[last].x = dragTarget.x;
        points[last].y = dragTarget.y;
      }
    }

    function physicsStep() {
      var last = points.length - 1;
      var damping = 0.993;
      for (var i = 1; i <= last; i++) {
        if (dragging && i === last) continue;
        var point = points[i];
        var velocityX = (point.x - point.oldX) * damping;
        var velocityY = (point.y - point.oldY) * damping;
        point.oldX = point.x;
        point.oldY = point.y;
        point.x += velocityX;
        point.y += velocityY + GRAVITY * FIXED_STEP * FIXED_STEP;
      }
      solveConstraints(8);
    }

    function chainEnergy() {
      var energy = 0;
      for (var i = 1; i < points.length; i++) {
        var dx = points[i].x - points[i].oldX;
        var dy = points[i].y - points[i].oldY;
        energy += dx * dx + dy * dy;
      }
      return energy;
    }

    function frame(now) {
      if (!lastFrameTime) lastFrameTime = now;
      accumulator += Math.min((now - lastFrameTime) / 1000, 0.033);
      lastFrameTime = now;
      while (accumulator >= FIXED_STEP) {
        physicsStep();
        accumulator -= FIXED_STEP;
      }
      draw();

      if (dragging || now < settleUntil || chainEnergy() > 0.006) {
        animationFrame = window.requestAnimationFrame(frame);
      } else {
        animationFrame = null;
        resetChain();
      }
    }

    function startSimulation(duration) {
      settleUntil = Math.max(settleUntil, performance.now() + (duration || 1800));
      if (animationFrame || motionQuery.matches) return;
      lastFrameTime = 0;
      accumulator = 0;
      animationFrame = window.requestAnimationFrame(frame);
    }

    function dropIn() {
      if (motionQuery.matches) {
        resetChain();
        return;
      }

      introActive = true;
      for (var i = 0; i < points.length; i++) {
        points[i].x = ANCHOR_X;
        points[i].y = i * 0.35;
        points[i].oldX = points[i].x;
        points[i].oldY = points[i].y;
      }
      draw();
      var started = performance.now();

      function lowerChain(now) {
        if (!introActive) return;
        var progress = Math.min(1, (now - started) / 680);
        var eased = 1 - Math.pow(1 - progress, 3);
        for (var i = 0; i < points.length; i++) {
          points[i].x = ANCHOR_X;
          points[i].y = i * SEGMENT_LENGTH * eased;
          points[i].oldX = points[i].x;
          points[i].oldY = points[i].y;
        }
        draw();

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(lowerChain);
        } else {
          introActive = false;
          animationFrame = null;
          resetChain();
          var bob = points[points.length - 1];
          bob.oldX = bob.x + 0.45;
          startSimulation(650);
        }
      }

      animationFrame = window.requestAnimationFrame(lowerChain);
    }

    function toggleTheme() {
      playSwitchClick();
      applyTheme(theme === 'dark' ? 'light' : 'dark', true);
    }

    function localPointer(event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * CANVAS_WIDTH / rect.width,
        y: (event.clientY - rect.top) * CANVAS_HEIGHT / rect.height
      };
    }

    function updateDrag(event) {
      var local = localPointer(event);
      pullDelta.x = local.x - pointerStart.x;
      pullDelta.y = local.y - pointerStart.y;
      if (Math.hypot(pullDelta.x, pullDelta.y) > 4) pointerMoved = true;

      var rawX = bobStart.x + pullDelta.x;
      var rawY = bobStart.y + pullDelta.y;
      var anchorDx = rawX - ANCHOR_X;
      var anchorDy = rawY;
      var radialDistance = Math.hypot(anchorDx, anchorDy) || 0.0001;
      var tension = Math.max(0, radialDistance - REST_LENGTH);
      var payout = Math.min(MAX_PAYOUT, tension * 0.55);
      var reach = REST_LENGTH + payout;
      if (radialDistance > reach) {
        rawX = ANCHOR_X + anchorDx / radialDistance * reach;
        rawY = anchorDy / radialDistance * reach;
      }
      dragTarget = {
        x: Math.max(9, Math.min(CANVAS_WIDTH - 9, rawX)),
        y: Math.max(8, Math.min(CANVAS_HEIGHT - 10, rawY))
      };
      segmentLength = reach / CHAIN_SEGMENTS;

      if (lastPointerSample) {
        var elapsed = Math.max(8, event.timeStamp - lastPointerSample.time) / 1000;
        var sampleX = (local.x - lastPointerSample.x) / elapsed;
        var sampleY = (local.y - lastPointerSample.y) / elapsed;
        pointerVelocity.x = pointerVelocity.x * 0.45 + sampleX * 0.55;
        pointerVelocity.y = pointerVelocity.y * 0.45 + sampleY * 0.55;
      }
      lastPointerSample = { x: local.x, y: local.y, time: event.timeStamp };

      if (motionQuery.matches) {
        solveConstraints(12);
        draw();
      } else {
        startSimulation(1200);
      }
    }

    function releaseChain() {
      dragging = false;
      dragTarget = null;
      segmentLength = SEGMENT_LENGTH;
      var bob = points[points.length - 1];
      var speed = Math.hypot(pointerVelocity.x, pointerVelocity.y);
      var scale = speed > 900 ? 900 / speed : 1;
      bob.oldX = bob.x - pointerVelocity.x * scale * FIXED_STEP;
      bob.oldY = bob.y - pointerVelocity.y * scale * FIXED_STEP;

      if (motionQuery.matches) {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
        resetChain();
      } else {
        startSimulation(2400);
      }
    }

    control.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 && event.pointerType !== 'touch') return;
      if (introActive) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
        introActive = false;
        resetChain();
      }
      var local = localPointer(event);
      var bob = points[points.length - 1];
      if (Math.hypot(local.x - bob.x, local.y - bob.y) > 25) return;

      activePointer = event.pointerId;
      pointerStart = local;
      bobStart = { x: bob.x, y: bob.y };
      pullDelta = { x: 0, y: 0 };
      pointerVelocity = { x: 0, y: 0 };
      lastPointerSample = { x: local.x, y: local.y, time: event.timeStamp };
      pointerMoved = false;
      allowPointerClick = true;
      dragging = true;
      dragTarget = { x: bob.x, y: bob.y };
      control.setPointerCapture(event.pointerId);
      startSimulation(1200);
    });

    control.addEventListener('pointermove', function (event) {
      if (event.pointerId !== activePointer) return;
      updateDrag(event);
    });

    function finishPointer(event, cancelled) {
      if (event.pointerId !== activePointer) return;
      var toggled = !cancelled && shouldToggleFromPull(pullDelta.x, pullDelta.y);
      if (toggled) toggleTheme();
      suppressClick = pointerMoved || toggled;
      allowPointerClick = !pointerMoved && !cancelled;
      activePointer = null;
      releaseChain();
      window.setTimeout(function () { suppressClick = false; }, 80);
    }

    control.addEventListener('pointerup', function (event) {
      finishPointer(event, false);
    });
    control.addEventListener('pointercancel', function (event) {
      finishPointer(event, true);
    });
    window.addEventListener('pointerup', function (event) {
      finishPointer(event, false);
    });
    window.addEventListener('pointercancel', function (event) {
      finishPointer(event, true);
    });
    control.addEventListener('lostpointercapture', function (event) {
      finishPointer(event, false);
    });

    function kickChain() {
      var bob = points[points.length - 1];
      bob.oldX = bob.x - 2.3;
      bob.oldY = bob.y + 0.4;
      startSimulation(1800);
    }

    control.addEventListener('click', function (event) {
      if (suppressClick || (event.detail > 0 && !allowPointerClick)) return;
      allowPointerClick = false;
      toggleTheme();
      if (!motionQuery.matches) kickChain();
    });

    control.addEventListener('keydown', function (event) {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')) return;
      event.preventDefault();
      toggleTheme();
      if (!motionQuery.matches) kickChain();
    });

    function followSystemTheme(event) {
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        applyTheme(event.matches ? 'dark' : 'light', false);
      }
    }
    if (themeQuery.addEventListener) themeQuery.addEventListener('change', followSystemTheme);
    else themeQuery.addListener(followSystemTheme);

    function handleMotionPreference() {
      if (!motionQuery.matches) return;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      introActive = false;
      resetChain();
    }
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotionPreference);
    else motionQuery.addListener(handleMotionPreference);

    window.addEventListener('resize', draw);
    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault();
      render = null;
      control.classList.remove('lamp-pull--webgl');
      draw();
    });

    if (render) control.classList.add('lamp-pull--webgl');
    resetChain();
    applyTheme(theme, false);
    dropIn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
