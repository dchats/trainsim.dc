const canvasRender = (() => {
  const imageCache = {};
  const canvas = document.getElementById('BasicCanvas');
  const ctx = canvas.getContext('2d');
  let canvasLoopTimer = 0;

  function resizeCanvas() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawScene();
  }

  function getImage(src) {
    if (!imageCache[src]) {
      const image = new Image();
      image.src = src;
      image.onload = drawScene;
      imageCache[src] = image;
    }
    return imageCache[src];
  }

  function splitGradientStops(stops) {
    const result = [];
    let level = 0;
    let current = '';

    for (const char of stops) {
      if (char == '(') level++;
      if (char == ')') level--;

      if (char == ',' && level == 0) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) result.push(current.trim());
    return result;
  }

  function parseGradientStop(stop, index, stopsCount, height) {
    const positionMatch = stop.match(/\s+([0-9.]+)(px|%)$/);
    const color = positionMatch ? stop.slice(0, positionMatch.index).trim() : stop;
    let offset = stopsCount <= 1 ? 0 : index / (stopsCount - 1);

    if (positionMatch) {
      offset = positionMatch[2] == '%' ? Number(positionMatch[1]) / 100 : Number(positionMatch[1]) / height;
    }

    return {
      color: normalizeCanvasColor(color),
      offset: Math.min(Math.max(offset, 0), 1)
    };
  }

  function normalizeCanvasColor(color) {
    const hslMatch = color.match(/^hsl\(\s*([0-9.]+)\s+([0-9.]+)%?\s+([0-9.]+)%\s*\)$/);

    if (hslMatch) {
      return `hsl(${hslMatch[1]}, ${hslMatch[2]}%, ${hslMatch[3]}%)`;
    }

    return color;
  }

  function makeGrowGradient(cssGradient, y, height) {
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    const match = cssGradient.match(/^linear-gradient\(180deg,\s*(.*)\)$/);

    if (!match) {
      gradient.addColorStop(0, 'hsl(0, 0%, 30%)');
      gradient.addColorStop(1, 'black');
      return gradient;
    }

    splitGradientStops(match[1]).forEach((stop, index, stops) => {
      const gradientStop = parseGradientStop(stop, index, stops.length, height);
      gradient.addColorStop(gradientStop.offset, gradientStop.color);
    });

    return gradient;
  }

  function drawCover(image, x, y, width, height, bottomOffset = 0) {
    if (!image.complete || !image.naturalWidth) return;

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + height - drawHeight - bottomOffset;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function getViewportLeft() {
    return camera_block ?? (position - camera_delta);
  }

  function getLayerOffset(layer) {
    return (camera_block ?? position) * layer.speed;
  }

  function drawScene() {
    if (!canvas || !ctx || CurrentMap == 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewHeight = height * 0.85;
    const growHeight = height - viewHeight;
    const viewportLeft = getViewportLeft();

    ctx.clearRect(0, 0, width, height);

    CurrentMap.blocks.forEach((blockLine, lineIndex) => {
      const layer = blocks_z[lineIndex];
      const layerOffset = getLayerOffset(layer);

      blockLine.forEach((element, blockIndex) => {
        const x = chunk_width_px * blockIndex + layerOffset - viewportLeft;

        if (x > width || x + chunk_width_px < 0) return;

        const layerPrefix = layer.z == 1 ? '' : layer.z + '_';
        const image = getImage(`icon/${CurrentMap.name}_${layerPrefix}pic${element}.png`);
        drawCover(image, x, 0, chunk_width_px, viewHeight, -2);
      });
    });

    if (CurrentMap.grow) {
      const growFill = makeGrowGradient(CurrentMap.grow, viewHeight, growHeight);
      CurrentMap.blocks[0].forEach((element, blockIndex) => {
        const x = chunk_width_px * blockIndex - viewportLeft;

        if (x > width || x + chunk_width_px < 0) return;

        ctx.fillStyle = growFill;
        ctx.fillRect(x, viewHeight, chunk_width_px, growHeight);
      });
    }

    const train = getImage(`http://trainsim.dc/icon/${CurrentMap.name}_train.png`);
    if (train.complete && train.naturalWidth) {
      ctx.drawImage(train, position - viewportLeft, viewHeight - train_height, train_length, train_height);
    }

    const mission = CurrentMap.missions[mission_num];
    if (mission && ['go+', 'go-', 'stop'].indexOf(mission[0]) !== -1) {
      const point = getImage('http://trainsim.dc/icon/point_map.png');
      drawCover(point, mission[1] - viewportLeft, viewHeight - 60, 50, 50);
    }
  }

  function showMissionHint() {
    const mission = CurrentMap.missions[mission_num];

    if (!mission) return;

    if (['go+', 'go-'].indexOf(mission[0]) !== -1) {
      NextPointBar.innerHTML = 'Следовать через точку: <br>' + mission[2] + ' ' + norm((mission[1] - train_length - position) * mpx);
    }

    if (['stop'].indexOf(mission[0]) !== -1) {
      NextPointBar.innerHTML = 'Остановится в указанном месте: <br>' + mission[2] + ' ' + norm((mission[1] - train_length - position) * mpx);
    }
  }

  function updateSpeedBar() {
    SpeedInBar.style.transform = 'rotate(' + (Math.min(speed, speedometer / 3.6) / speedometer * 3.6 * 180 + 45) + 'deg)';

    sp = Object.keys(CurrentMap.speed_map).filter(x => x <= position).reverse()[0];
    if (last_set_maxspeed !== CurrentMap.speed_map[sp]) {
      last_set_maxspeed = CurrentMap.speed_map[sp];
      document.querySelector(':root').style.setProperty('--rotate_MSP', 180 - (CurrentMap.speed_map[sp] / speedometer * 180) + 'deg');
    }

    sp_2 = Object.keys(CurrentMap.speed_map).indexOf(sp) + (direction == 1 ? 1 : 0);
    NextPointBar2.innerHTML = Object.values(CurrentMap.speed_map)[sp_2 + (direction == -1 ? -1 : 0)] ? (Object.values(CurrentMap.speed_map)[sp_2 + (direction == -1 ? -1 : 0)] + 'км/ч через ' + norm((Object.keys(CurrentMap.speed_map)[sp_2] - position) * mpx)) : '';

    if (work == 1) {
      SpeedBar.innerHTML = `<span><span style="font-size: 24px; ${speed * 3.6 > last_set_maxspeed ? 'color: yellow' : 'color: white'}">` + Math.floor(speed * 3.6) + '.' + Math.floor((speed * 3.6) % 1 * 10) + ' км/ч' + '</span><br><center><span style="font-size: 16px">' + (new Date(new Date().getTime() - difference_timestamp).toString().split(' ')[4]) + '</span><br><center><span style="font-size: 16px">' + (+fase_num < 0 ? Math.abs(fase_num) + 'B' : fase_num + 'T') + ' ' + (direction == 1 ? '→' : '←') + '</span></center></span>';
    } else {
      SpeedBar.innerHTML = '<span><span style="font-size: 24px;">ㅤ</span><br><center><span style="font-size: 16px">' + (new Date(new Date().getTime() - difference_timestamp).toString().split(' ')[4]) + '</span><br><center><span style="font-size: 16px">ㅤ</span></center></span>';
    }
  }

  window.gameLoop = function() {
    acceleration = acceleration_start + (acceleration_end - acceleration_start) * Math.min(new Date().getTime() - acceleration_timestamp, acceleration_reaction) / acceleration_reaction;
    speed += (
      acceleration / MassIndex
      - (speed ** 2 * air_coef) / MassIndex
      - 9.8 * (0.001 + 2 * 1e-5 * speed)
    ) * (new Date().getTime() - (last_timestamp ?? new Date().getTime())) / 1000;

    if (speed < 0) {
      speed = 0;
    }

    MissionWorker();

    position += direction * speed / mpx * (new Date().getTime() - (last_timestamp ?? new Date().getTime())) / 1000;
    last_timestamp = new Date().getTime();

    if (position > (max_position ?? (CurrentMap.blocks[0].length * chunk_width_px - train_length))) {
      position = (max_position ?? (CurrentMap.blocks[0].length * chunk_width_px - train_length));
      speed = 0;
    }

    if (position > 26843500) {
      position = 3840;
    }

    if (position < (min_position ?? 0)) {
      position = (min_position ?? 0);
      speed = 0;
    }

    updateSpeedBar();
    showMissionHint();
    drawScene();

    canvasLoopTimer = setTimeout(gameLoop, 1000 / tickRate);
  };

  window.MissionWorker = async function() {
    if (
      CurrentMap.missions[mission_num][0] == undefined ||
      (CurrentMap.missions[mission_num][0] == 'go+' && position + train_length > CurrentMap.missions[mission_num][1]) ||
      (CurrentMap.missions[mission_num][0] == 'go-' && position + train_length < CurrentMap.missions[mission_num][1]) ||
      (CurrentMap.missions[mission_num][0] == 'stop' && Math.abs(position - CurrentMap.missions[mission_num][1] + train_length) < 100 && speed == 0) ||
      (CurrentMap.missions[mission_num][0] == 'text' && text_button == 1) ||
      (CurrentMap.missions[mission_num][0] == 'custom' && eval(CurrentMap.missions[mission_num][1]))
    ) {
      SetText('');
      text_button = 0;
      mission_num++;

      if (CurrentMap.missions[mission_num][0] == 'text') {
        SetText(CurrentMap.missions[mission_num][1]);
        NextPointBar.innerHTML = 'Нажмите Enter чтобы продолжить';
      }

      if (CurrentMap.missions[mission_num][0] == 'custom') {
        eval(CurrentMap.missions[mission_num][2]);
      }

      if (CurrentMap.missions[mission_num][0] == 'end') {
        GameEnd();
      }
    }
  };

  window.GameStart = function(map, file) {
    clearTimeout(canvasLoopTimer);

    MainMenu.setAttribute('on', 0);
    BasicGame.setAttribute('on', 1);
    NextPointBar.innerHTML = '';
    NextPointBar2.innerHTML = '';

    position = map.position;
    speed = 0;
    acceleration = 0;
    MassIndex = map.MassIndex;
    air_coef = map.air_coef;
    max_acceleration = map.max_acceleration;
    max_brake = map.max_brake;
    speedometer = map.speedometer;
    direction = 1;
    fase_num = 0;
    train_length = map.train_length;
    train_height = map.train_height;
    camera_delta = map.camera_delta;
    camera_block = map.camera_block;
    min_position = map.min_position;
    max_position = map.max_position;
    last_timestamp = undefined;
    mission_num = 0;
    acceleration_reaction = map.acceleration_reaction;
    acceleration_start = 0;
    acceleration_end = 0;
    acceleration_timestamp = 0;
    work = -1;
    blocks_z = map.blocks_z;

    SBP2.innerHTML = speedometer / 4;
    SBP3.innerHTML = speedometer / 4 * 2;
    SBP4.innerHTML = speedometer / 4 * 3;
    SBP5.innerHTML = speedometer;

    CurrentMap = map;
    timestamp = map.timestamp;
    difference_timestamp = new Date().getTime() - timestamp;

    resizeCanvas();
    gameLoop();
  };

  window.GameEnd = function() {
    clearTimeout(canvasLoopTimer);
    MainMenu.setAttribute('on', 1);
    BasicGame.setAttribute('on', 0);
    localStorage.setItem(CurrentMap.name, 1);
    eval(`MapBlock_${CurrentMap.name.split('map')[1]}`).style.background = 'green';
  };

  window.addEventListener('resize', resizeCanvas);

  return {
    drawScene,
    resizeCanvas
  };
})();