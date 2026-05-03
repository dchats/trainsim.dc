mpx = 20/884.5;
chunk_width_px = 1920
chunk_width_m = chunk_width_px * mpx
text_button = 0
last_set_maxspeed = 0


data = []
tickRate = 60
function gameLoop() {
  acceleration = acceleration_start+(acceleration_end-acceleration_start)*Math.min(new Date().getTime() - acceleration_timestamp, acceleration_reaction)/acceleration_reaction
  speed += (
        acceleration / MassIndex
        - (speed**2*air_coef) / MassIndex
        - 9.8*(0.001 + 2*1e-5*speed)
        )
        * (new Date().getTime() - (last_timestamp??new Date().getTime()))/1000
  if (speed < 0) {
    speed = 0;
  }
  
  MissionWorker()

  position += direction * speed / mpx * (new Date().getTime() - (last_timestamp??new Date().getTime()))/1000;
  BasicTrain.style.marginLeft = position
  ii = 0
  while (ii < blocks_z.length) {
    eval(`BasicView_${blocks_z[ii].z}`).style.marginLeft = (camera_block??position)*(blocks_z[ii].speed)
    ii++
  }
  document.body.scrollLeft = camera_block??position-camera_delta
  last_timestamp = new Date().getTime()

  if (position > (max_position??(CurrentMap.blocks[0].length * chunk_width_px - train_length))) {
    position = (max_position??(CurrentMap.blocks[0].length * chunk_width_px - train_length))
    speed = 0
  }
  if (position > 26843500) {
    position = 3840
  }
  if (position < (min_position??0)) {
    position = (min_position??0)
    speed = 0
  }

  SpeedInBar.style.transform = 'rotate('+(Math.min(speed, speedometer/3.6)/speedometer*3.6*180+45)+'deg)'
  sp = Object.keys(CurrentMap.speed_map).filter(x => x<=position).reverse()[0]
  if (last_set_maxspeed !== CurrentMap.speed_map[sp]) {
    last_set_maxspeed = CurrentMap.speed_map[sp]
    document.querySelector(':root').style.setProperty('--rotate_MSP', 180-(CurrentMap.speed_map[sp]/(speedometer)*180)+'deg')
  }
  sp_2 = Object.keys(CurrentMap.speed_map).indexOf(sp) + (direction==1 ? 1 : 0)
  NextPointBar2.innerHTML = Object.values(CurrentMap.speed_map)[sp_2+(direction==-1 ? -1 : 0)] ? (Object.values(CurrentMap.speed_map)[sp_2+(direction==-1 ? -1 : 0)] + 'км/ч через ' + norm((Object.keys(CurrentMap.speed_map)[sp_2]-position)*mpx)) : ''

  if (['go+', 'go-'].indexOf(CurrentMap.missions[mission_num][0]) !== -1) {
    NextPointBar.innerHTML = 'Следовать через точку: <br>' + CurrentMap.missions[mission_num][2] + ' ' + norm((CurrentMap.missions[mission_num][1] - train_length - position)*mpx)
  }
  if (['stop'].indexOf(CurrentMap.missions[mission_num][0]) !== -1) {
    NextPointBar.innerHTML = 'Остановится в указанном месте: <br>' + CurrentMap.missions[mission_num][2] + ' ' + norm((CurrentMap.missions[mission_num][1] - train_length - position)*mpx)
  }
  if (work == 1) {
    SpeedBar.innerHTML = `<span><span style="font-size: 24px; ${speed*3.6 > last_set_maxspeed ? 'color: yellow' : 'color: white'}">`+Math.floor(speed*3.6)+'.'+Math.floor((speed*3.6)%1*10)+' км/ч'+'</span><br><center><span style="font-size: 16px">'+(new Date(new Date().getTime() - difference_timestamp).toString().split(' ')[4])+'</span><br><center><span style="font-size: 16px">'+(+fase_num<0 ? Math.abs(fase_num) + 'B' : fase_num + 'T')+' '+(direction == 1 ? '→' : '←')+'</span></center></span>'
  } else {
    SpeedBar.innerHTML = '<span><span style="font-size: 24px;">ㅤ</span><br><center><span style="font-size: 16px">'+(new Date(new Date().getTime() - difference_timestamp).toString().split(' ')[4])+'</span><br><center><span style="font-size: 16px">ㅤ</span></center></span>'
  }
  //GameBar.innerHTML = "Position:" + Math.floor(10*position*mpx)/10 + " Speed:" + Math.floor(10*speed*3.6)/10

  setTimeout(gameLoop, 1000 / tickRate);
}

async function MissionWorker() {
  if (
    CurrentMap.missions[mission_num][0] == undefined || 
    (CurrentMap.missions[mission_num][0] == 'go+' && position + train_length > CurrentMap.missions[mission_num][1]) ||
    (CurrentMap.missions[mission_num][0] == 'go-' && position + train_length < CurrentMap.missions[mission_num][1]) ||
    (CurrentMap.missions[mission_num][0] == 'stop' && Math.abs(position-CurrentMap.missions[mission_num][1] + train_length) < 100 && speed == 0) ||
    (CurrentMap.missions[mission_num][0] == 'text' && text_button == 1) ||
    (CurrentMap.missions[mission_num][0] == 'custom' && eval(CurrentMap.missions[mission_num][1]))
  ) {
    try {
      GoPoint.remove()
    } catch (e) {}
    SetText('')
    text_button = 0
    mission_num++
    if (['go+', 'go-', 'stop'].indexOf(CurrentMap.missions[mission_num][0]) !== -1) {
      BasicView.innerHTML += '<div id="GoPoint" style="margin-left: '+CurrentMap.missions[mission_num][1]+'px"></div>'
    }
    if (CurrentMap.missions[mission_num][0] == 'text') {
      SetText(CurrentMap.missions[mission_num][1])
      NextPointBar.innerHTML = 'Нажмите Enter чтобы продолжить'
    }
    if (CurrentMap.missions[mission_num][0] == 'custom') {
      eval(CurrentMap.missions[mission_num][2])
    }
    if (CurrentMap.missions[mission_num][0] == 'end') {
      GameEnd()
    }
  }
}
function SetText(text) {
  TextBlock.style.opacity = 1
  if (text == '') {
    TextBlock.style.opacity = 0
  }
  TextBlock.innerHTML = '<span style="background:rgba(0, 0, 0, 0.5); max-width: 50vw; padding: 5px; border-radius: .3rem; text-align: center;">'+text+'</span>'
}

function norm(m) {
	return (Math.abs(m) >= 1000 ? Math.abs(Math.floor(m/100)/10)+'км' : Math.abs(Math.floor(m))+'м')
}
// 0.8086345679012346
maps = [
  ['Обучение', 'Знакомство с DC Train Simulator. Вы проедете часть маршрута DC Town, познакомитесь с управлением локомотива ТЕП 60 и остановитесь на станции «Темниково»', 3],
  ['Пробежка по городу', 'Поездка с пассажирскими вагонами по DC Town. Вы проедете от станции "Темниково" до станции "Красная площадь" соблюдая расписание.', 8],
  ['Рождество в DC Town 2.0', 'Скоро... (на новый год)', '~ 20']
]
map_counter = 1
function CheckMap(map_id) {
  MM_Desc.innerHTML = `<div class="MM_DescImg" style="background-image: url('http://trainsim.dc/icon/map${map_id}_full.png');"></div><div style="font-size: 18px; margin: 10px;">${maps[map_id-1][0]}</div><div style="font-size: 16px; margin: 10px; width: calc(100% - 20px); white-space: pre-wrap;">${maps[map_id-1][1]}</div><center><button style="padding: 3px; border-radius: .3rem; font-size: 18px" onclick="GameStart(map${map_id})">Запустить</button></center>`
}
function MapObr() {
  maps.forEach(element => {
    MM_Maps.innerHTML += `
    <table class="MM_MapBlock" id="MapBlock_${map_counter}" style="${localStorage.getItem('map'+map_counter) == 1 ? 'background: green' : ''}" onclick="CheckMap(${map_counter})">
      <colgroup>
          <col span="1" style="width: 80px;">
          <col span="1">
      </colgroup>
      <tbody>
          <tr>
            <td rowspan="2"><img src="http://trainsim.dc/icon/map${map_counter}.png" class="MapIcon"></td>
            <td style="font-size: 18px; height: 40px">${element[0]}</td>
          </tr>
          <tr>
            <td style="font-size: 14px; height: 20px">${element[2]} мин.</td>
          </tr>
      </tbody>
    </table>
    `
    map_counter++
  });
}
MapObr()
map1 = {
  name: 'map1',
  position: 9600,
  MassIndex: 1,
  air_coef: 0.0004928608928571428,
  max_acceleration: 0.99206349206349206349206349206349,
  max_brake: -0.99206349206349206349206349206349,
  speedometer: 160,
  train_length: 884.5,
  train_height: 220,
  camera_delta: 150,
  min_position: 2070,
  max_position: undefined,
  acceleration_reaction: 1000,
  timestamp: 1762160400000,
  grow: 'linear-gradient(180deg, hsl(0 0 50%) 0%, hsl(0 0 30%) 10px, black 10px, black 11px, hsl(0 59% 33%) 11px, hsl(0 59% 33%) 30%, hsl(0 59.42% 23%) 100%)',
  fases: {
    '-5': '-max_acceleration*1.5',
    '-4': '-max_acceleration*1.2',
    '-3': '-max_acceleration*0.7',
    '-2': '-max_acceleration*0.3',
    '-1': '-max_acceleration*0.1',
    '0': '0',
    '1': 'max_acceleration*0.1',
    '2': 'max_acceleration*0.3',
    '3': 'max_acceleration*0.5',
    '4': 'max_acceleration*0.7',
    '5': 'max_acceleration'
  },
  blocks_z: [{z: 1, speed: 0}],
  speed_map: {0: 9999},
  blocks: [[1,9,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,4,4,4,4,5,6,7,8,4,4,4,4,4]],
  missions: [[], ['text', 'Добро пожаловать в DC Train Simulator'], ['text', 'В этом задании вы проедете по части DC Town научитесь запускать локомотив, разгоняться и тормозить.'], ['custom', 'work==1', `NextPointBar.innerHTML = 'нажмите D чтобы запустить двигатель'`], ['text', 'Используйте W, S чтобы управлять тягой и тормозами.'], ['stop', 53600, 'Темниково'], ['custom', 'work==-1', `NextPointBar.innerHTML = 'нажмите D чтобы выключить двигатель'`], ['text', 'На этом обучение завершено. Теперь вы можете попробовать другие сценарии.'], ['end']]
}
map2 = {
  name: 'map2',
  position: 5000,
  MassIndex: 1+(50*5)/126,
  air_coef: 0.0004928608928571428,
  max_acceleration: 0.99206349206349206349206349206349,
  max_brake: -0.99206349206349206349206349206349,
  speedometer: 160,
  train_length: 2472,
  train_height: 220,
  camera_delta: -1518,
  min_position: 0,
  max_position: undefined,
  acceleration_reaction: 1000,
  timestamp: 1762142400000,
  grow: 'linear-gradient(180deg, hsl(0 0 30%) 0%, hsl(0 0 10%) 10px, black 10px, black 11px, hsl(0 94% 16.5%) 11px, hsl(0 94% 16.5%) 30%, hsl(0 94.42% 11.5%) 100%)',
  fases: {
    '-5': 'max_brake',
    '-4': 'max_brake*0.7',
    '-3': 'max_brake*0.5',
    '-2': 'max_brake*0.3',
    '-1': 'max_brake*0.1',
    '0': '0',
    '1': 'max_acceleration*0.1',
    '2': 'max_acceleration*0.3',
    '3': 'max_acceleration*0.5',
    '4': 'max_acceleration*0.7',
    '5': 'max_acceleration'
  },
  blocks_z: [{z: 1, speed: 0}],
  speed_map: {0: 9999},
  blocks: [[5,6,7,8,3,1,4,3,4,3,4,3,4,3,4,3,5,6,7,2,4,3,4,3,4,3,1,4,3,9,10,10,10,10,10,11,12,13,14,10,10,10,10,10,10,10,10,10]],
  missions: [[], ['text', 'Доброе утро! Сегодня вы будете вести посажирский состав до станции "Красная площадь" соблюдая расписание.'], ['custom', 'work==1', `NextPointBar.innerHTML = 'нажмите D чтобы запустить двигатель'`], ['custom', 'new Date(new Date() - difference_timestamp).getTime() > 1762142420000', `NextPointBar.innerHTML = 'Ожидайте...'`], ['stop', 38192, '7:03 Водонапорная'], ['custom', 'new Date(new Date() - difference_timestamp).getTime() > 1762142400000+210000', `NextPointBar.innerHTML = 'Ждать до 7:03:30'`], ['stop', 74672, '7:06 Красная площадь'], ['text', 'Это конечная станция данной карты. Остановите локомотив в следующей точке, где его примет другой машинист.'], ['stop', 74672+1920*5, 'Линия DC Town (3-й километр)'], ['text', 'Спасибо за работу! Можете отправляться домой.'], ['end']]
}

map3 = {
  name: 'map3',
  position: 0,
  MassIndex: 3.246031746031746,
  air_coef: 0.0004928608928571428,
  max_acceleration: 4.231532039517199,
  max_brake: -4.1691666210101995*2/3,
  speedometer: 340,
  train_length: 2475/2,
  train_height: 220,
  camera_delta: -400,
  camera_block: 2420,
  min_position: 0,
  max_position: undefined,
  acceleration_reaction: 1000,
  timestamp: 1762174800000,
  grow: 'linear-gradient(180deg, hsl(0 0 50%) 0%, hsl(0 0 30%) 10px, black 10px, black 11px, hsl(0 59% 33%) 11px, hsl(0 59% 33%) 30%, hsl(0 59.42% 23%) 100%)',
  fases: {
    '-10': 'max_brake',
    '-9': 'max_brake*0.9',
    '-8': 'max_brake*0.8',
    '-7': 'max_brake*0.7',
    '-6': 'max_brake*0.6',
    '-5': 'max_brake*0.5',
    '-4': 'max_brake*0.4',
    '-3': 'max_brake*0.3',
    '-2': 'max_brake*0.2',
    '-1': 'max_brake*0.1',
    '0': '0',
    '1': 'max_acceleration*0.1',
    '2': 'max_acceleration*0.2',
    '3': 'max_acceleration*0.3',
    '4': 'max_acceleration*0.4',
    '5': 'max_acceleration*0.5',
    '6': 'max_acceleration*0.6',
    '7': 'max_acceleration*0.7',
    '8': 'max_acceleration*0.8',
    '9': 'max_acceleration*0.9',
    '10': 'max_acceleration'
  },
  blocks_z: [{z: 1, speed: 0}, {z: 0, speed: 0.9}],
  blocks: [[0,1,2,3,3,3,3,3,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,8,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,9,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,8,5,5,5,5,5,5,5,5,,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,9,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,8,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,9,3,3,3,3,3,3,3,3,3,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,2], [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
  speed_map: {0: 40, 15360: 120, 57600: 200, 150000: 250, 300000: 340, 800000: 300, 1000000: 250, 1150000: 150, 1250000: 70, 1300000: 40, 1500000: 0},
  missions: [[], ['custom', 'speed == 0', 'NextPointBar2.style.opacity = 0; NextPointBar.innerHTML = "Ожидайте прибытия вашего поезда."; speed=5.4*0; acceleration_end = eval(CurrentMap.fases[-2]); SPB_full.style.opacity = 0;'], ['custom', '1', 'SPB_full.style.opacity = 1; camera_block = undefined; min_position = 1520;'], ['text', 'C наступающим! Добро пожаловать в новогодний DC Town 2.0! Сегодня вы проедете до главного вокзала "Большое зайцево" ***'], ['custom', 'work==1', `NextPointBar.innerHTML = 'нажмите D чтобы запустить двигатель'`], ['custom', '1', 'NextPointBar2.style.opacity = 1;'], ['stop', 10000, 'Next'], ['end']]
}

CurrentMap = 0;
function GameStart(map, file) {
    MainMenu.setAttribute('on', 0)
    BasicGame.setAttribute('on', 1)
    BasicView.innerHTML = ''
    BasicGrow.innerHTML = ''

    position = map.position; // в метрах
    speed = 0;
    acceleration = 0;
    MassIndex = map.MassIndex
    air_coef = map.air_coef
    max_acceleration = map.max_acceleration
    max_brake = map.max_brake
    speedometer = map.speedometer
    direction = 1
    fase_num = 0
    train_length = map.train_length
    camera_delta = map.camera_delta
    camera_block = map.camera_block
    min_position = map.min_position
    max_position = map.max_position
    last_timestamp = undefined
    mission_num = 0
    acceleration_reaction = map.acceleration_reaction
    acceleration_start = 0
    acceleration_end = 0
    acceleration_timestamp = 0
    work = -1

    blocks_z = map.blocks_z

    SBP2.innerHTML = speedometer/4
    SBP3.innerHTML = speedometer/4*2
    SBP4.innerHTML = speedometer/4*3
    SBP5.innerHTML = speedometer

    i = 0
    while (i<map.blocks.length) {
      game_load_counter = 0
      BasicView.innerHTML += `<div id="BasicView_${blocks_z[i].z}"></div>`
      map.blocks[i].forEach(element => {
        eval(`BasicView_${blocks_z[i].z}`).innerHTML += `<div class="BlockView" style="background-image: url('icon/${map.name}_${blocks_z[i].z == 1 ? '' : blocks_z[i].z+'_'}pic${element}.png'); margin-left: ${chunk_width_px*game_load_counter++}; z-index: ${blocks_z[i].z}"></div>`
      });
      i++
    }
    game_load_counter = 0
    map.blocks[0].forEach(element => {
      BasicGrow.innerHTML += `<div class="BlockGrow" style="background: ${map.grow}; margin-left: ${chunk_width_px*game_load_counter++}"></div>`
    });
    CurrentMap = map
    BasicTrain.style.backgroundImage = `url("http://trainsim.dc/icon/${map.name}_train.png")`
    BasicTrain.style.width = map.train_length + 'px'
    BasicTrain.style.height = map.train_height + 'px'
    BasicTrain.style.marginTop = `calc(85vh - ${map.train_height}px)`
    timestamp = map.timestamp
    difference_timestamp = new Date().getTime() - timestamp

    gameLoop()
}

function GameEnd() {
  MainMenu.setAttribute('on', 1)
  BasicGame.setAttribute('on', 0)
  localStorage.setItem(CurrentMap.name, 1)
  eval(`MapBlock_${CurrentMap.name.split('map')[1]}`).style.background = 'green'
}


function runOnKeys(func, ...codes) {
  pressed = new Set();

  document.addEventListener('keydown', function(event) {
    pressed.add(event.code);

    for (code of codes) {
      if (!pressed.has(code)) {
        return;
      }
    }
    pressed.clear();

    func();
  });

  document.addEventListener('keyup', function(event) {
    pressed.delete(event.code);
  });

}

Array.prototype.search = function(search, search_sp_type) {
  if (search_sp_type == 'ind') {
      return this.map(function(item, index) {
          if (item.toString().indexOf(search) !== -1) {
              return item+index
          }
      }).filter(x => x !== undefined)
  }
  return this.filter(item => item.toString().indexOf(search) !== -1)
}

runOnKeys(
  function() {if(work == 1 && CurrentMap.fases[fase_num+1]) {acceleration_start = acceleration; acceleration_timestamp = new Date().getTime(); acceleration_end = eval(CurrentMap.fases[++fase_num])}},
  "KeyW"
);
runOnKeys(
  function() {document.body.innerHTML = ''},
  "KeyQ"
);
runOnKeys(
  function() {if(work == 1 && CurrentMap.fases[fase_num-1]) {acceleration_start = acceleration; acceleration_timestamp = new Date().getTime(); acceleration_end = eval(CurrentMap.fases[--fase_num])}},
  "KeyS"
);
runOnKeys(
  function() {if(work == 1 && speed == 0 && fase_num <= 0) {direction= -direction;}},
  "KeyR"
);
runOnKeys(
  function() {if (speed == 0 && fase_num <= 0) {work = -work}},
  "KeyD"
);
runOnKeys(
  function() {MainMenu.setAttribute('on', 1); BasicGame.setAttribute('on', 0)},
  "Escape"
);
runOnKeys(
  function() {text_button = 1},
  "Enter"
);
//GameStart(map3)