"use strict";

/* =========================================================
   КРИПТО ГАРАЖ
   Полностью вымышленная офлайн-игра.
   Все аккаунты и сохранения работают через localStorage.
========================================================= */

const ECONOMY = {
  miningBaseRate: .00000120,
  maxGpuLevel: 10,
  sellConditionFloor: 20,
  sellUpgradeRecovery: .58,
  storagePerLevel: 2,
  exchange:{initial:100000,min:50000,max:250000,stepPercent:3,fee:0.015},
  upgrader:{houseEdge:.05,minChance:1,maxChance:80},
  prestige:{garageLevel:5,requiredTopGPUs:10}
};

const GPU_TYPES = [
  {id:"1050ti",name:"GTX 1050 Ti",price:.045,hash:8,power:75,temp:52,tier:"entry",upgradeBase:.014,resale:.48},
  {id:"1060",name:"GTX 1060",price:.075,hash:12,power:90,temp:54,tier:"entry",upgradeBase:.022,resale:.48},
  {id:"1070",name:"GTX 1070",price:.12,hash:17,power:120,temp:57,tier:"entry",upgradeBase:.032,resale:.48},
  {id:"1660",name:"GTX 1660",price:.17,hash:22,power:125,temp:56,tier:"mid",upgradeBase:.045,resale:.50},
  {id:"1080ti",name:"GTX 1080 Ti",price:.25,hash:30,power:180,temp:62,tier:"mid",upgradeBase:.065,resale:.50},
  {id:"1660super",name:"GTX 1660 Super",price:.21,hash:26,power:125,temp:57,tier:"mid",upgradeBase:.055,resale:.50},
  {id:"2060",name:"RTX 2060",price:.32,hash:34,power:160,temp:59,tier:"mid",upgradeBase:.082,resale:.52},
  {id:"2070super",name:"RTX 2070 Super",price:.44,hash:43,power:215,temp:62,tier:"mid",upgradeBase:.105,resale:.52},
  {id:"3060",name:"RTX 3060",price:.52,hash:48,power:170,temp:60,tier:"high",upgradeBase:.13,resale:.53},
  {id:"3060ti",name:"RTX 3060 Ti",price:.68,hash:58,power:200,temp:61,tier:"high",upgradeBase:.165,resale:.54},
  {id:"3070",name:"RTX 3070",price:.86,hash:70,power:220,temp:63,tier:"high",upgradeBase:.21,resale:.54},
  {id:"3080",name:"RTX 3080",price:1.15,hash:88,power:300,temp:66,tier:"high",upgradeBase:.28,resale:.55},
  {id:"3090",name:"RTX 3090",price:1.55,hash:105,power:350,temp:69,tier:"high",upgradeBase:.37,resale:.55},
  {id:"4060",name:"RTX 4060",price:.78,hash:64,power:115,temp:55,tier:"high",upgradeBase:.19,resale:.54},
  {id:"4070super",name:"RTX 4070 Super",price:1.35,hash:98,power:220,temp:61,tier:"top",upgradeBase:.34,resale:.56},
  {id:"4080super",name:"RTX 4080 Super",price:2.05,hash:132,power:320,temp:64,tier:"top",upgradeBase:.52,resale:.57},
  {id:"4090",name:"RTX 4090",price:3.10,hash:165,power:450,temp:69,tier:"top",upgradeBase:.78,resale:.58}
];

const GARAGE_LEVELS = [
  {level:1,rigs:1,slots:4,cost:0},
  {level:2,rigs:2,slots:8,cost:1.35},
  {level:3,rigs:3,slots:16,cost:4.8},
  {level:4,rigs:5,slots:32,cost:14},
  {level:5,rigs:8,slots:64,cost:42}
];

const UPGRADE_DEFS = {
  electricity:{
    name:"Электросистема",
    icon:"⚡",
    desc:"Снижает условные расходы на электроэнергию и повышает эффективность майнинга."
  },

  cooling:{
    name:"Охлаждение",
    icon:"❄️",
    desc:"Снижает рабочую температуру и помогает оборудованию работать эффективнее."
  },

  storage:{
    name:"Хранилище",
    icon:"💾",
    desc:"Увеличивает внутреннюю ёмкость технического хранилища гаража."
  },

  efficiency:{
    name:"Эффективность майнинга",
    icon:"⚙️",
    desc:"Напрямую увеличивает количество вырабатываемых игровых BTC."
  },

  size:{
    name:"Размер гаража",
    icon:"🏭",
    desc:"Открывает следующий уровень гаража и дополнительные места для оборудования."
  },

  power:{
    name:"Блок питания",
    icon:"🔌",
    desc:"Улучшает подачу энергии и уменьшает эффективную нагрузку оборудования."
  },

  network:{
    name:"Стабильность сети",
    icon:"📡",
    desc:"Повышает стабильность симуляции и эффективность виртуального майнинга."
  }
};

const ACHIEVEMENTS = [
  ["firstGPU","Первая видеокарта","Купите свою первую видеокарту."],
  ["firstRig","Первая станция","Установите первую видеокарту и запустите майнинг."],
  ["oneBTC","Первый BTC","Заработайте хотя бы 1 игровой BTC."],
  ["tenGPU","10 видеокарт","Соберите 10 видеокарт."],
  ["garage5","Гараж 5-го уровня","Достигните максимального уровня гаража."],
  ["hash1000","1000 МХ/с","Достигните хешрейта 1000 МХ/с."],
  ["millionaire","Крупный баланс","Накопите 100 игровых BTC."],
  ["ultimate","Абсолютный гараж","Достигните 5-го уровня и соберите 32+ видеокарты."]
];

/* =========================================================
   АККАУНТЫ
========================================================= */

const AccountSystem = {

  accountsKey:"cryptoGarage_accounts",

  currentKey:"cryptoGarage_currentAccount",

  normalize(username){
    return String(username||"")
      .trim()
      .toLowerCase();
  },

  validUsername(username){
    return /^[a-zA-Zа-яА-Я0-9_-]{3,24}$/.test(username);
  },

  getAccounts(){

    try{

      const raw=
        localStorage.getItem(this.accountsKey);

      if(!raw)return {};

      const parsed=JSON.parse(raw);

      return parsed&&typeof parsed==="object"
        ?parsed
        :{};

    }catch(e){

      return {};

    }

  },

  saveAccounts(accounts){

    try{

      localStorage.setItem(
        this.accountsKey,
        JSON.stringify(accounts)
      );

      return true;

    }catch(e){

      return false;

    }

  },

  create(username,password){

    const clean=String(username||"").trim();
    const normalized=this.normalize(clean);

    if(!this.validUsername(clean)){

      return {
        ok:false,
        message:"Имя пользователя должно содержать от 3 до 24 символов: буквы, цифры, _ или -."
      };

    }

    if(String(password||"").length<4){

      return {
        ok:false,
        message:"Пароль должен содержать минимум 4 символа."
      };

    }

    const accounts=this.getAccounts();

    if(accounts[normalized]){

      return {
        ok:false,
        message:"Такое имя пользователя уже занято."
      };

    }

    accounts[normalized]={
      username:clean,
      password:String(password),
      createdAt:Date.now()
    };

    if(!this.saveAccounts(accounts)){

      return {
        ok:false,
        message:"Не удалось сохранить аккаунт в браузере."
      };

    }

    return {
      ok:true,
      username:clean
    };

  },

  login(username,password){

    const normalized=this.normalize(username);
    const accounts=this.getAccounts();
    const account=accounts[normalized];

    if(!account){

      return {
        ok:false,
        message:"Пользователь с таким именем не найден."
      };

    }

    if(account.password!==String(password)){

      return {
        ok:false,
        message:"Неверный пароль."
      };

    }

    try{

      localStorage.setItem(
        this.currentKey,
        normalized
      );

    }catch(e){}

    return {
      ok:true,
      username:account.username,
      key:normalized
    };

  },

  current(){

    try{

      return localStorage.getItem(this.currentKey);

    }catch(e){

      return null;

    }

  },

  logout(){

    try{

      localStorage.removeItem(this.currentKey);

    }catch(e){}

  },

  saveForCurrent(state){

    const key=this.current();

    if(!key)return false;

    try{

      localStorage.setItem(
        `cryptoGarage_save_${key}`,
        JSON.stringify(state)
      );

      return true;

    }catch(e){

      return false;

    }

  },

  loadFor(usernameKey){

    const key=usernameKey||this.current();

    if(!key)return null;

    try{

      const raw=
        localStorage.getItem(
          `cryptoGarage_save_${key}`
        );

      if(!raw)return null;

      return JSON.parse(raw);

    }catch(e){

      return null;

    }

  },

  resetCurrentSave(){

    const key=this.current();

    if(!key)return;

    try{

      localStorage.removeItem(
        `cryptoGarage_save_${key}`
      );

    }catch(e){}

  },

  hasCurrentSave(){

    return !!this.loadFor();

  }

};

/* =========================================================
   ТУТОРИАЛ
========================================================= */

const TUTORIAL = [

  {
    icon:"₿",
    title:"Добро пожаловать в Крипто Гараж",
    text:"Это полностью вымышленный симулятор. Здесь ты развиваешь гараж, покупаешь видеокарты и получаешь игровые BTC. Никаких реальных денег или криптовалют здесь нет."
  },

  {
    icon:"⛏",
    title:"Как работает майнинг",
    text:"Видеокарты создают хешрейт. Чем больше и лучше оборудование, тем больше игровых BTC ты получаешь за минуту. Для начала купи хотя бы одну видеокарту."
  },

  {
    icon:"🖥",
    title:"Покупка видеокарт",
    text:"Открой раздел «Главная» и найди рынок видеокарт справа. После покупки оборудование появится в разделе «Видеокарты»."
  },

  {
    icon:"⚙",
    title:"Улучшение оборудования",
    text:"В разделе «Видеокарты» можно улучшать отдельные видеокарты. Улучшения повышают их характеристики и помогают увеличивать доход."
  },

  {
    icon:"🏭",
    title:"Развитие гаража",
    text:"Раздел «Улучшения гаража» позволяет улучшать электричество, охлаждение, хранилище, эффективность, питание и другие системы."
  },

  {
    icon:"🎰",
    title:"Колесо удачи",
    text:"Колесо удачи — это отдельная игровая мини-игра с вымышленными BTC. Она не использует реальные деньги."
  },

  {
    icon:"🏆",
    title:"Достижения и престиж",
    text:"Достижения выдаются за развитие гаража. Престиж открывается позже и позволяет получить постоянный бонус к эффективности майнинга."
  },

  {
    icon:"💾",
    title:"Твоё сохранение",
    text:"Прогресс автоматически сохраняется отдельно для твоего аккаунта в этом браузере. При следующем входе твои BTC, видеокарты, гараж и улучшения будут восстановлены."
  }

];

/* =========================================================
   GAME STATE
========================================================= */

function freshState(){

  return {

    balance:1.00,
    rubBalance:0,
    exchangeRate:ECONOMY.exchange.initial,
    previousExchangeRate:ECONOMY.exchange.initial,
    rateHistory:[ECONOMY.exchange.initial],
    playtime:0,
    profileCreatedAt:Date.now(),
    maxBalance:1,
    maxHashrate:0,
    currentTheme:"cyan",

    totalEarned:0,
    totalSpent:0,

    owned:[],

    garage:1,

    upgrades:{
      electricity:0,
      cooling:0,
      storage:0,
      efficiency:0,
      size:0,
      power:0,
      network:0
    },

    achievements:[],

    prestige:0,

    stats:{
      spins:0,
      wins:0,
      losses:0,
      biggestWin:0,
      totalWon:0,
      totalSpent:0,
      attempts:0,
      successfulUpgrades:0,
      failedUpgrades:0,
      purchasedGPUs:0,
      soldGPUs:0,
      gpuUpgrades:0,
      garageUpgrades:0,
      totalRubEarned:0,
      totalRubSpent:0,
      highestMultiplier:0
    },

    settings:{
      sound:true,
      animations:true,
      particles:true,
      reduced:false
    },

    tutorialCompleted:false

  };

}

/* =========================================================
   GPU
========================================================= */

class GPU{

  constructor(typeId,level=1,condition=100){

    this.typeId=typeId;

    this.level=
      Math.max(
        1,
        Math.floor(
          Number(level)||1
        )
      );

    this.condition=
      Math.max(
        0,
        Math.min(
          100,
          Number(condition)||0
        )
      );

  }

  type(){

    return GPU_TYPES.find(
      x=>x.id===this.typeId
    )||GPU_TYPES[0];

  }

  conditionMultiplier(){

    return .72+
      (this.condition/100)*.28;

  }

  hash(){

    return this.type().hash*
      (1+(this.level-1)*.18)*
      this.conditionMultiplier();

  }

  power(){

    return this.type().power*
      (1+(this.level-1)*.06);

  }

  temp(){

    return this.type().temp+
      (this.level-1)*2;

  }

  upgradeCost(){

    return this.type().price*
      (.35*this.level);

  }

}

/* =========================================================
   GARAGE
========================================================= */

class Garage{

  constructor(game){
    this.game=game;
  }

  data(){

    return GARAGE_LEVELS[
      Math.min(
        Math.max(
          0,
          this.game.state.garage-1
        ),
        GARAGE_LEVELS.length-1
      )
    ];

  }

  capacity(){

    return this.data().slots+
      this.game.state.upgrades.storage*2;

  }

  rigs(){
    return this.data().rigs;
  }

  canUpgrade(){
    return this.game.state.garage<5;
  }

  cost(){

    if(!this.canUpgrade())return Infinity;

    return GARAGE_LEVELS[
      this.game.state.garage
    ].cost;

  }

  upgrade(){

    if(!this.canUpgrade())return false;

    const cost=this.cost();

    if(
      this.game.state.balance+1e-12<
      cost
    ){
      return false;
    }

    this.game.state.balance-=cost;

    this.game.state.garage++;

    this.game.notify(
      "Гараж улучшен",
      `Открыт ${this.game.state.garage}-й уровень гаража.`
    );

    this.game.sound("upgrade");

    return true;

  }

}

/* =========================================================
   MINING
========================================================= */

class MiningSystem{

  constructor(game){

    this.game=game;

    this.timer=null;

    this.last=performance.now();

    this.lastSave=0;

  }

  get running(){
    return !!this.timer;
  }

  hashrate(){

    return this.game.state.owned.reduce(
      (total,g)=>{

        const gpu=
          new GPU(
            g.typeId,
            g.level,
            g.condition
          );

        return total+gpu.hash();

      },
      0
    );

  }

  power(){

    return this.game.state.owned.reduce(
      (total,g)=>{

        const gpu=
          new GPU(
            g.typeId,
            g.level,
            g.condition
          );

        return total+gpu.power();

      },
      0
    );

  }

  efficiency(){

    const s=this.game.state;

    return 1+
      s.upgrades.efficiency*.04+
      s.upgrades.electricity*.07+
      s.upgrades.cooling*.035+
      s.upgrades.power*.035+
      s.upgrades.network*.03+
      s.prestige*.05;

  }

  coolingMultiplier(){

    return Math.max(
      .55,
      1-
      this.game.state.upgrades.cooling*.035
    );

  }

  ratePerSecond(){

    const hash=this.hashrate();

    if(hash<=0)return 0;

    /*
      Базовый коэффициент был .00000100.
      Увеличен примерно на 30%:
      .00000100 × 1.30 = .00000130
    */

    const baseRate=ECONOMY.miningBaseRate;

    return hash*
      this.efficiency()*
      baseRate;

  }

  electricityPerMinute(){

    const p=this.power();

    const reduction=Math.max(
      .35,
      1-
      this.game.state.upgrades.electricity*.07-
      this.game.state.upgrades.power*.035
    );

    return p*.00000035*reduction;

  }

  start(){

    if(this.timer)return;

    if(this.hashrate()<=0){

      this.game.notify(
        "Нет видеокарт",
        "Купите хотя бы одну видеокарту перед запуском майнинга."
      );

      return;

    }

    this.last=performance.now();

    this.timer=setInterval(
      ()=>this.tick(),
      1000
    );

    this.game.updateVisualState();

    this.game.notify(
      "Майнинг запущен",
      "Вымышленная добыча игровых BTC началась."
    );

    this.game.sound("start");

  }

  stop(){

    if(this.timer){

      clearInterval(this.timer);

      this.timer=null;

    }

    this.game.updateVisualState();

  }

  tick(){

    if(!this.running)return;

    const s=this.game.state;

    const earned=
      this.ratePerSecond();

    s.balance=
      Math.max(
        0,
        s.balance+earned
      );

    s.totalEarned+=earned;
    s.maxBalance=Math.max(Number(s.maxBalance)||0,s.balance);

    for(const g of s.owned){

      g.condition=
        Math.max(
          0,
          Number(g.condition)-.002
        );

    }

    this.game.history.hash.push(
      this.hashrate()
    );

    this.game.history.earn.push(
      earned*60
    );

    if(this.game.history.hash.length>40){
      this.game.history.hash.shift();
    }

    if(this.game.history.earn.length>40){
      this.game.history.earn.shift();
    }

    this.game.checkAchievements();

    this.game.updateUI();

    if(
      Date.now()-this.lastSave>5000
    ){

      this.game.save();

      this.lastSave=Date.now();

    }

  }

}

/* =========================================================
   ROULETTE
========================================================= */

class Roulette{

  constructor(game){

    this.game=game;

    this.busy=false;

    this.symbols=[
      "7",
      "★",
      "A",
      "♦",
      "●",
      "◆"
    ];

  }

  multiplier(a,b,c){

    if(
      a===b&&
      b===c
    ){

      if(a==="7")return 10;

      if(a==="★")return 5;

      if(a==="A")return 3;

      return 4;

    }

    if(
      a===b||
      b===c||
      a===c
    ){
      return 2;
    }

    return 0;

  }

  async spin(){

    if(this.busy)return;

    const game=this.game;

    const input=
      document.getElementById("betInput");

    let bet=Number(input.value);

    if(
      !Number.isFinite(bet)||
      bet<=0
    ){

      game.notify(
        "Неверная ставка",
        "Введите положительное количество игровых BTC."
      );

      return;

    }

    bet=Math.min(
      bet,
      game.state.balance
    );

    bet=
      Math.floor(
        bet*1000000
      )/1000000;

    if(bet<=0){

      game.notify(
        "Недостаточно игровых BTC",
        "Ваш баланс слишком мал для этой ставки."
      );

      return;

    }

    this.busy=true;

    const spinButton=
      document.getElementById("spinBtn");

    spinButton.disabled=true;

    game.state.balance=
      Math.max(
        0,
        game.state.balance-bet
      );

    game.state.stats.spins++;

    game.state.stats.totalSpent+=bet;

    const slots=[
      document.getElementById("slot0"),
      document.getElementById("slot1"),
      document.getElementById("slot2")
    ];

    slots.forEach(
      x=>x.classList.add("spinning")
    );

    game.sound("spin");

    const final=[
      this.symbols[
        Math.floor(
          Math.random()*
          this.symbols.length
        )
      ],

      this.symbols[
        Math.floor(
          Math.random()*
          this.symbols.length
        )
      ],

      this.symbols[
        Math.floor(
          Math.random()*
          this.symbols.length
        )
      ]
    ];

    for(let i=0;i<3;i++){

      await new Promise(
        resolve=>
          setTimeout(
            resolve,
            650+i*250
          )
      );

      slots[i].textContent=
        final[i];

      slots[i].classList.remove(
        "spinning"
      );

    }

    const mult=
      this.multiplier(...final);

    const payout=
      bet*mult;

    if(mult>0){

      game.state.balance+=payout;

      game.state.stats.wins++;

      game.state.stats.totalWon+=payout;

      game.state.stats.biggestWin=
        Math.max(
          game.state.stats.biggestWin,
          payout
        );

      document.getElementById(
        "rouletteResult"
      ).textContent=
        `ПОБЕДА — x${mult} = +${payout.toFixed(6)} игровых BTC`;

      game.notify(
        "Колесо удачи",
        `Вы получили ${payout.toFixed(6)} игровых BTC.`
      );

      game.sound("win");

    }else{

      game.state.stats.losses++;

      document.getElementById(
        "rouletteResult"
      ).textContent=
        `Совпадения нет — −${bet.toFixed(6)} игровых BTC`;

      game.notify(
        "Совпадения нет",
        "Символы не выстроились в выигрышную комбинацию."
      );

    }

    this.busy=false;

    spinButton.disabled=false;

    game.updateUI();

    game.checkAchievements();

    game.save();

  }

}

/* =========================================================
   GAME
========================================================= */

class Game{

  constructor(){

    this.state=freshState();

    this.garage=
      new Garage(this);

    this.mining=
      new MiningSystem(this);

    this.roulette=
      new Roulette(this);

    this.history={
      hash:[],
      earn:[]
    };

    this.audio=null;

    this.tutorialStep=0;

  }

  init(){

    this.bind();

    this.updateAuthUI();

    this.renderMarket();

    this.renderUpgrades();

    this.renderAchievements();

    this.renderInventory();

    this.updateUI();

    this.applySettings();

    this.restoreSession();

  }

  restoreSession(){

    const current=
      AccountSystem.current();

    if(!current){

      this.showAuth();

      return;

    }

    const accounts=
      AccountSystem.getAccounts();

    if(!accounts[current]){

      AccountSystem.logout();

      this.showAuth();

      return;

    }

    this.loginCurrentAccount(
      current,
      false
    );

  }

  loginCurrentAccount(
    usernameKey,
    showNotification=true
  ){

    const accounts=
      AccountSystem.getAccounts();

    const account=
      accounts[usernameKey];

    if(!account){

      this.showAuth();

      return;

    }

    const loaded=
      AccountSystem.loadFor(
        usernameKey
      );

    this.mining.stop();

    this.state=
      this.merge(
        freshState(),
        loaded||freshState()
      );

    this.history={
      hash:[],
      earn:[]
    };

    this.updateAuthUI();

    document.getElementById(
      "authScreen"
    ).classList.add("hidden");

    document.getElementById(
      "landing"
    ).classList.remove("hidden");

    document.getElementById(
      "app"
    ).classList.add("hidden");

    this.renderAll();

    if(showNotification){

      this.notify(
        "Вход выполнен",
        `Добро пожаловать, ${account.username}.`
      );

    }

  }

  showAuth(){

    this.mining.stop();

    document.getElementById(
      "authScreen"
    ).classList.remove("hidden");

    document.getElementById(
      "landing"
    ).classList.add("hidden");

    document.getElementById(
      "app"
    ).classList.add("hidden");

  }

  showError(message){

    const error=
      document.getElementById(
        "authError"
      );

    error.textContent=message;

    error.classList.remove(
      "hidden"
    );

  }

  clearError(){

    document.getElementById(
      "authError"
    ).classList.add(
      "hidden"
    );

  }

  updateAuthUI(){

    const current=
      AccountSystem.current();

    const accounts=
      AccountSystem.getAccounts();

    const account=
      current
        ?accounts[current]
        :null;

    const username=
      account
        ?account.username
        :"—";

    const elements=[
      "landingUsername",
      "currentUsername",
      "settingsUsername"
    ];

    elements.forEach(id=>{

      const el=
        document.getElementById(id);

      if(el){
        el.textContent=username;
      }

    });

  }

  merge(base,loaded){

    if(
      !loaded||
      typeof loaded!=="object"
    ){
      return base;
    }

    const result={
      ...base,
      ...loaded
    };

    result.upgrades={
      ...base.upgrades,
      ...(loaded.upgrades||{})
    };

    result.stats={
      ...base.stats,
      ...(loaded.stats||{})
    };

    result.settings={
      ...base.settings,
      ...(loaded.settings||{})
    };

    result.owned=
      Array.isArray(loaded.owned)
        ?loaded.owned.map(g=>({

          typeId:
            GPU_TYPES.some(
              t=>t.id===g.typeId
            )
              ?g.typeId
              :"1660",

          level:
            Math.max(
              1,
              Math.min(
                ECONOMY.maxGpuLevel,
                Math.floor(
                  Number(g.level)||1
                )
              )
            ),

          condition:
            Math.max(
              0,
              Math.min(
                100,
                Number(g.condition)||0
              )
            )

        }))
        :[];

    result.achievements=
      Array.isArray(
        loaded.achievements
      )
        ?loaded.achievements.filter(
          id=>
            ACHIEVEMENTS.some(
              a=>a[0]===id
            )
        )
        :[];

    result.balance=
      Number.isFinite(
        Number(result.balance)
      )
        ?Math.max(
          0,
          Number(result.balance)
        )
        :base.balance;

    result.totalEarned=
      Number.isFinite(
        Number(result.totalEarned)
      )
        ?Math.max(
          0,
          Number(result.totalEarned)
        )
        :0;

    result.garage=
      Math.min(
        5,
        Math.max(
          1,
          Math.floor(
            Number(result.garage)||1
          )
        )
      );

    for(
      const key of Object.keys(
        base.upgrades
      )
    ){

      result.upgrades[key]=
        Math.max(
          0,
          Math.floor(
            Number(
              result.upgrades[key]
            )||0
          )
        );

    }

    result.prestige=
      Math.max(
        0,
        Math.floor(
          Number(result.prestige)||0
        )
      );

    result.tutorialCompleted=
      !!result.tutorialCompleted;

    return result;

  }

  bind(){

    /* AUTH TABS */

    document.getElementById(
      "loginTab"
    ).onclick=()=>{

      document.getElementById(
        "loginTab"
      ).classList.add("active");

      document.getElementById(
        "registerTab"
      ).classList.remove("active");

      document.getElementById(
        "loginForm"
      ).classList.remove("hidden");

      document.getElementById(
        "registerForm"
      ).classList.add("hidden");

      this.clearError();

    };

    document.getElementById(
      "registerTab"
    ).onclick=()=>{

      document.getElementById(
        "registerTab"
      ).classList.add("active");

      document.getElementById(
        "loginTab"
      ).classList.remove("active");

      document.getElementById(
        "registerForm"
      ).classList.remove("hidden");

      document.getElementById(
        "loginForm"
      ).classList.add("hidden");

      this.clearError();

    };

    /* LOGIN */

    document.getElementById(
      "loginBtn"
    ).onclick=()=>{

      this.clearError();

      const username=
        document.getElementById(
          "loginUsername"
        ).value.trim();

      const password=
        document.getElementById(
          "loginPassword"
        ).value;

      if(!username||!password){

        this.showError(
          "Заполните имя пользователя и пароль."
        );

        return;

      }

      const result=
        AccountSystem.login(
          username,
          password
        );

      if(!result.ok){

        this.showError(
          result.message
        );

        return;

      }

      this.loginCurrentAccount(
        result.key
      );

      document.getElementById(
        "loginPassword"
      ).value="";

    };

    /* REGISTER */

    document.getElementById(
      "registerBtn"
    ).onclick=()=>{

      this.clearError();

      const username=
        document.getElementById(
          "registerUsername"
        ).value.trim();

      const password=
        document.getElementById(
          "registerPassword"
        ).value;

      const confirm=
        document.getElementById(
          "registerPasswordConfirm"
        ).value;

      if(password!==confirm){

        this.showError(
          "Пароли не совпадают."
        );

        return;

      }

      const result=
        AccountSystem.create(
          username,
          password
        );

      if(!result.ok){

        this.showError(
          result.message
        );

        return;

      }

      const login=
        AccountSystem.login(
          username,
          password
        );

      if(!login.ok){

        this.showError(
          "Аккаунт создан, но автоматический вход не удался."
        );

        return;

      }

      this.state=freshState();

      this.save();

      this.loginCurrentAccount(
        login.key,
        false
      );

      this.notify(
        "Аккаунт создан",
        `Добро пожаловать, ${result.username}.`
      );

      document.getElementById(
        "registerUsername"
      ).value="";

      document.getElementById(
        "registerPassword"
      ).value="";

      document.getElementById(
        "registerPasswordConfirm"
      ).value="";

    };

    /* ENTER */

    document.getElementById(
      "enterBtn"
    ).onclick=()=>{

      document.getElementById(
        "landing"
      ).classList.add("hidden");

      document.getElementById(
        "app"
      ).classList.remove("hidden");

      this.sound("click");

      this.updateUI();

      if(!this.state.tutorialCompleted){

        setTimeout(
          ()=>this.openTutorial(),
          250
        );

      }

    };

    /* NAVIGATION */

    document.querySelectorAll(
      ".nav button"
    ).forEach(btn=>{

      btn.onclick=()=>{

        document.querySelectorAll(
          ".nav button"
        ).forEach(
          x=>x.classList.remove("active")
        );

        document.querySelectorAll(
          ".page"
        ).forEach(
          x=>x.classList.remove("active")
        );

        btn.classList.add("active");

        const page=
          document.getElementById(
            btn.dataset.page
          );

        if(page){
          page.classList.add("active");
        }

        this.sound("click");

        this.updateUI();

      };

    });

    /* MINING */

    document.getElementById(
      "startMining"
    ).onclick=()=>{
      this.mining.start();
    };

    document.getElementById(
      "stopMining"
    ).onclick=()=>{
      this.mining.stop();
    };

    /* BET BUTTONS */

    document.querySelectorAll(
      "[data-bet]"
    ).forEach(button=>{

      button.onclick=()=>{

        document.getElementById(
          "betInput"
        ).value=
          button.dataset.bet;

      };

    });

    document.getElementById(
      "maxBet"
    ).onclick=()=>{

      const max=
        Math.max(
          .01,
          this.state.balance
        );

      document.getElementById(
        "betInput"
      ).value=
        Math.min(
          max,
          999999
        ).toFixed(6);

    };

    document.getElementById(
      "spinBtn"
    ).onclick=()=>{
      this.roulette.spin();
    };

    /* SAVE */

    document.getElementById(
      "saveBtn"
    ).onclick=()=>{

      if(this.save()){

        this.notify(
          "Игра сохранена",
          "Прогресс текущего аккаунта сохранён локально."
        );

      }else{

        this.notify(
          "Ошибка сохранения",
          "Браузер не разрешил сохранить данные."
        );

      }

    };

    /* LOAD */

    document.getElementById(
      "loadBtn"
    ).onclick=()=>{

      const loaded=
        AccountSystem.loadFor();

      if(!loaded){

        this.notify(
          "Сохранение не найдено",
          "Для этого аккаунта сохранение отсутствует."
        );

        return;

      }

      this.mining.stop();

      this.state=
        this.merge(
          freshState(),
          loaded
        );

      this.history={
        hash:[],
        earn:[]
      };

      this.renderAll();

      this.notify(
        "Игра загружена",
        "Последний прогресс текущего аккаунта восстановлен."
      );

    };

    /* RESET */

    document.getElementById(
      "resetBtn"
    ).onclick=()=>{

      document.getElementById(
        "resetModal"
      ).classList.remove(
        "hidden"
      );

    };

    document.getElementById(
      "cancelReset"
    ).onclick=()=>{

      document.getElementById(
        "resetModal"
      ).classList.add(
        "hidden"
      );

    };

    document.getElementById(
      "confirmReset"
    ).onclick=()=>{

      this.mining.stop();

      AccountSystem.resetCurrentSave();

      this.state=freshState();

      this.history={
        hash:[],
        earn:[]
      };

      this.renderAll();

      document.getElementById(
        "resetModal"
      ).classList.add(
        "hidden"
      );

      this.notify(
        "Сохранение сброшено",
        "Создан новый гараж с начальным прогрессом."
      );

      this.save();

    };

    /* PRESTIGE */

    document.getElementById(
      "prestigeBtn"
    ).onclick=()=>{

      if(
        this.state.garage<5||
        this.state.owned.length<10
      ){

        this.notify(
          "Престиж недоступен",
          "Достигните 5-го уровня гаража и соберите минимум 10 видеокарт."
        );

        return;

      }

      const confirmed=
        window.confirm(
          "Престиж сбросит видеокарты, гараж и улучшения, но сохранит уровень престижа. Продолжить?"
        );

      if(!confirmed)return;

      this.mining.stop();

      this.state.owned=[];

      this.state.garage=1;

      Object.keys(
        this.state.upgrades
      ).forEach(
        key=>
          this.state.upgrades[key]=0
      );

      this.state.prestige++;

      this.state.balance=1;

      this.history={
        hash:[],
        earn:[]
      };

      this.notify(
        "Престиж активирован",
        `Постоянный бонус к эффективности теперь +${this.state.prestige*5}%.`
      );

      this.sound("achievement");

      this.renderAll();

      this.save();

    };

    /* SOUND */

    document.getElementById(
      "muteBtn"
    ).onclick=()=>{

      this.state.settings.sound=
        !this.state.settings.sound;

      this.applySettings();

      this.save();

      if(this.state.settings.sound){
        this.sound("click");
      }

    };

    const toggles={
      soundToggle:"sound",
      animationToggle:"animations",
      particleToggle:"particles",
      reducedToggle:"reduced"
    };

    Object.entries(
      toggles
    ).forEach(
      ([id,key])=>{

        document.getElementById(
          id
        ).onclick=()=>{

          this.state.settings[key]=
            !this.state.settings[key];

          this.applySettings();

          this.save();

        };

      }
    );

    /* LOGOUT */

    document.getElementById(
      "logoutBtn"
    ).onclick=()=>{

      this.mining.stop();

      this.save();

      AccountSystem.logout();

      this.state=freshState();

      this.history={
        hash:[],
        earn:[]
      };

      this.showAuth();

      this.clearError();

      document.getElementById(
        "loginUsername"
      ).value="";

      document.getElementById(
        "loginPassword"
      ).value="";

      document.getElementById(
        "loginTab"
      ).click();

    };

    /* TUTORIAL */

    document.getElementById(
      "tutorialNext"
    ).onclick=()=>{

      if(
        this.tutorialStep>=
        TUTORIAL.length-1
      ){

        this.finishTutorial();

      }else{

        this.tutorialStep++;

        this.renderTutorial();

      }

    };

    document.getElementById(
      "tutorialBack"
    ).onclick=()=>{

      if(this.tutorialStep>0){

        this.tutorialStep--;

        this.renderTutorial();

      }

    };

    document.getElementById(
      "tutorialSkip"
    ).onclick=()=>{
      this.finishTutorial();
    };

    /* BEFORE CLOSE */

    window.addEventListener(
      "beforeunload",
      ()=>{
        this.save();
      }
    );

  }

  openTutorial(){

    this.tutorialStep=0;

    document.getElementById(
      "tutorialModal"
    ).classList.remove(
      "hidden"
    );

    this.renderTutorial();

  }

  renderTutorial(){

    const item=
      TUTORIAL[
        this.tutorialStep
      ];

    const total=TUTORIAL.length;

    document.getElementById(
      "tutorialStepText"
    ).textContent=
      `ШАГ ${this.tutorialStep+1} ИЗ ${total}`;

    document.getElementById(
      "tutorialProgressBar"
    ).style.width=
      `${((this.tutorialStep+1)/total)*100}%`;

    document.getElementById(
      "tutorialIcon"
    ).textContent=
      item.icon;

    document.getElementById(
      "tutorialTitle"
    ).textContent=
      item.title;

    document.getElementById(
      "tutorialText"
    ).textContent=
      item.text;

    document.getElementById(
      "tutorialBack"
    ).disabled=
      this.tutorialStep===0;

    document.getElementById(
      "tutorialNext"
    ).textContent=
      this.tutorialStep===total-1
        ?"ЗАВЕРШИТЬ"
        :"ДАЛЕЕ";

  }

  finishTutorial(){

    this.state.tutorialCompleted=true;

    this.save();

    document.getElementById(
      "tutorialModal"
    ).classList.add(
      "hidden"
    );

    this.notify(
      "Обучение завершено",
      "Теперь можно развивать свой гараж."
    );

  }

  save(){

    return AccountSystem.saveForCurrent(
      this.state
    );

  }

  renderAll(){

    this.renderMarket();

    this.renderUpgrades();

    this.renderAchievements();

    this.renderInventory();

    this.updateUI();

    this.applySettings();

  }

  renderMarket(){

    const box=
      document.getElementById(
        "marketList"
      );

    box.innerHTML=
      GPU_TYPES.map(
        t=>`

        <div class="gpu-card">

          <div class="gpu-visual">

            <div style="position:absolute;left:10px;top:9px;color:#6e7d96;font-size:9px;font-weight:900">
              ${t.id.toUpperCase()} // ИГРОВОЕ ОБОРУДОВАНИЕ
            </div>

            <div class="gpu-fans">
              <i class="gpu-fan"></i>
              <i class="gpu-fan"></i>
            </div>

          </div>

          <div class="gpu-name">
            ${t.name}
          </div>

          <div class="gpu-details">

            <div>
              ХЕШРЕЙТ
              <b>${t.hash} МХ/с</b>
            </div>

            <div>
              ПИТАНИЕ
              <b>${t.power} Вт</b>
            </div>

            <div>
              ТЕМП.
              <b>${t.temp}°C</b>
            </div>

          </div>

          <div class="card-actions">

            <button
              class="btn"
              onclick="game.buyGPU('${t.id}')"
            >
              КУПИТЬ
              <span class="price">
                ${t.price.toFixed(2)} BTC
              </span>
            </button>

          </div>

        </div>

      `
      ).join("");

  }

  buyGPU(typeId){

    const type=
      GPU_TYPES.find(
        x=>x.id===typeId
      );

    if(!type)return;

    if(
      this.state.owned.length>=
      this.garage.capacity()
    ){

      this.notify(
        "Гараж заполнен",
        "Улучшите гараж или хранилище, чтобы открыть дополнительные места."
      );

      return;

    }

    if(
      this.state.balance+1e-12<
      type.price
    ){

      this.notify(
        "Недостаточно игровых BTC",
        "На балансе недостаточно вымышленных средств."
      );

      return;

    }

    this.state.balance=
      Math.max(
        0,
        this.state.balance-type.price
      );

    this.state.owned.push({
      typeId,
      level:1,
      condition:100
    });

    this.sound("purchase");

    this.notify(
      "Видеокарта куплена",
      `${type.name} добавлена в ваш гараж.`
    );

    this.renderInventory();

    this.updateUI();

    this.checkAchievements();

    this.save();

  }

  renderInventory(){

    const box=
      document.getElementById(
        "inventoryGrid"
      );

    if(!this.state.owned.length){

      box.innerHTML=`

        <div class="muted" style="padding:30px">
          Инвентарь пуст.
          Откройте рынок и купите свою первую видеокарту.
        </div>

      `;

      document.getElementById(
        "inventoryCount"
      ).textContent=
        "0 видеокарт";

      return;

    }

    box.innerHTML=
      this.state.owned.map(
        (g,i)=>{

          const gpu=
            new GPU(
              g.typeId,
              g.level,
              g.condition
            );

          const t=gpu.type();

          return `

            <div class="inventory-card">

              <div style="display:flex;justify-content:space-between;gap:10px">

                <div>

                  <b>${t.name}</b>

                  <div
                    class="muted"
                    style="font-size:10px"
                  >
                    Видеокарта №${i+1}
                  </div>

                </div>

                <span class="badge">
                  УРОВЕНЬ ${g.level}
                </span>

              </div>

              <div class="condition">

                <i
                  style="width:${Math.max(0,g.condition)}%"
                ></i>

              </div>

              <div class="inv-stats">

                <span>
                  ХЕШРЕЙТ
                  <b>
                    ${gpu.hash().toFixed(1)} МХ/с
                  </b>
                </span>

                <span>
                  ПИТАНИЕ
                  <b>
                    ${gpu.power().toFixed(0)} Вт
                  </b>
                </span>

                <span>
                  ТЕМПЕРАТУРА
                  <b>
                    ${gpu.temp().toFixed(0)}°C
                  </b>
                </span>

                <span>
                  СОСТОЯНИЕ
                  <b>
                    ${g.condition.toFixed(0)}%
                  </b>
                </span>

              </div>

              <div class="inventory-actions">

                <button
                  class="btn"
                  onclick="game.upgradeGPU(${i})"
                >
                  УЛУЧШИТЬ
                </button>

                <button
                  class="btn danger"
                  onclick="game.sellGPU(${i})"
                >
                  ПРОДАТЬ
                </button>

              </div>

            </div>

          `;

        }
      ).join("");

    document.getElementById(
      "inventoryCount"
    ).textContent=
      `${this.state.owned.length} видеокарт`;

  }

  upgradeGPU(index){

    const g=
      this.state.owned[index];

    if(!g)return;

    if(g.level>=5){

      this.notify(
        "Максимальный уровень",
        "Эта видеокарта уже достигла 5-го уровня."
      );

      return;

    }

    const gpu=
      new GPU(
        g.typeId,
        g.level,
        g.condition
      );

    const cost=
      gpu.upgradeCost();

    if(
      this.state.balance+1e-12<
      cost
    ){

      this.notify(
        "Недостаточно игровых BTC",
        `Улучшение стоит ${cost.toFixed(4)} игровых BTC.`
      );

      return;

    }

    this.state.balance=
      Math.max(
        0,
        this.state.balance-cost
      );

    g.level++;

    this.sound("upgrade");

    this.notify(
      "Видеокарта улучшена",
      `${gpu.type().name} теперь имеет ${g.level}-й уровень.`
    );

    this.renderInventory();

    this.updateUI();

    this.checkAchievements();

    this.save();

  }

  sellGPU(index){

    const g=
      this.state.owned[index];

    if(!g)return;

    const gpu=
      new GPU(
        g.typeId,
        g.level,
        g.condition
      );

    const refund=
      gpu.type().price*
      .55*
      (1+(g.level-1)*.12)*
      (Math.max(20,g.condition)/100);

    this.state.balance+=refund;

    this.state.owned.splice(
      index,
      1
    );

    this.notify(
      "Видеокарта продана",
      `Получено ${refund.toFixed(4)} игровых BTC.`
    );

    this.renderInventory();

    this.updateUI();

    this.checkAchievements();

    this.save();

  }

  renderUpgrades(){

    const box=
      document.getElementById(
        "upgradeGrid"
      );

    box.innerHTML=
      Object.entries(
        UPGRADE_DEFS
      )
      .map(
        ([key,d])=>{

          const level=
            this.state.upgrades[key];

          let current="";
          let next="";
          let cost="";

          if(key==="size"){

            current=
              `Уровень гаража ${this.state.garage}`;

            next=
              this.state.garage<5
                ?`Уровень гаража ${this.state.garage+1}`
                :"МАКСИМАЛЬНЫЙ УРОВЕНЬ";

            cost=this.garage.cost();

          }else{

            current=
              `Уровень ${level}`;

            next=
              `Уровень ${level+1}`;

            cost=
              .18*
              Math.pow(
                1.65,
                level
              )*
              (key==="storage"?1.4:1);

          }

          const disabled=
            key==="size"&&
            this.state.garage>=5;

          return `

            <div class="upgrade-card">

              <div class="upgrade-head">

                <strong>
                  ${d.icon} ${d.name}
                </strong>

                <span class="badge">
                  УР.
                  ${
                    key==="size"
                      ?this.state.garage
                      :level
                  }
                </span>

              </div>

              <div class="upgrade-info">

                ${d.desc}

                <br><br>

                <span class="muted">
                  Сейчас:
                </span>
                ${current}

                <br>

                <span class="muted">
                  Следующий:
                </span>
                ${next}

              </div>

              <div class="upgrade-row">

                <span class="cost">

                  ${
                    Number.isFinite(cost)
                      ?cost.toFixed(3)
                      :"МАКС."
                  }

                  ${
                    Number.isFinite(cost)
                      ?" игровых BTC"
                      :""
                  }

                </span>

                <button
                  class="btn"
                  onclick="game.buyUpgrade('${key}')"
                  ${disabled?"disabled":""}
                >
                  УЛУЧШИТЬ
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");

  }

  buyUpgrade(key){

    if(!UPGRADE_DEFS[key])return;

    if(key==="size"){

      if(this.garage.upgrade()){

        this.renderUpgrades();

        this.updateUI();

        this.checkAchievements();

        this.save();

      }else{

        this.notify(
          "Улучшение недоступно",
          "Проверьте баланс или текущий уровень гаража."
        );

      }

      return;

    }

    const level=
      this.state.upgrades[key];

    const cost=
      .18*
      Math.pow(
        1.65,
        level
      )*
      (key==="storage"?1.4:1);

    if(
      this.state.balance+1e-12<
      cost
    ){

      this.notify(
        "Недостаточно игровых BTC",
        `Улучшение стоит ${cost.toFixed(4)} игровых BTC.`
      );

      return;

    }

    this.state.balance=
      Math.max(
        0,
        this.state.balance-cost
      );

    this.state.upgrades[key]++;

    this.sound("upgrade");

    this.notify(
      "Система улучшена",
      `${UPGRADE_DEFS[key].name} достигла уровня ${this.state.upgrades[key]}.`
    );

    this.renderUpgrades();

    this.updateUI();

    this.checkAchievements();

    this.save();

  }

  updateUI(){

    const s=this.state;

    const m=this.mining;

    const hash=m.hashrate();

    const power=m.power();

    const rate=
      m.ratePerSecond()*60;

    const temp=
      s.owned.length
        ?Math.round(
          s.owned.reduce(
            (total,g)=>{

              const gpu=
                new GPU(
                  g.typeId,
                  g.level,
                  g.condition
                );

              return total+gpu.temp();

            },
            0
          )/
          s.owned.length+
          (m.running?7:0)*
          m.coolingMultiplier()
        )
        :25;

    const eff=
      m.efficiency();

    document.getElementById(
      "balance"
    ).textContent=
      this.safeNum(
        s.balance
      ).toFixed(6);

    document.getElementById(
      "btcRate"
    ).textContent=
      this.safeNum(
        rate
      ).toFixed(6);

    document.getElementById(
      "garageLevel"
    ).textContent=
      `УР. ${s.garage}`;

    document.getElementById(
      "gpuCount"
    ).textContent=
      `${s.owned.length} / ${this.garage.capacity()}`;

    document.getElementById(
      "power"
    ).textContent=
      `${power.toFixed(0)} Вт`;

    document.getElementById(
      "hashrate"
    ).textContent=
      `${hash.toFixed(1)} МХ/с`;

    document.getElementById(
      "temperature"
    ).textContent=
      `${temp}°C`;

    document.getElementById(
      "efficiency"
    ).textContent=
      `${(eff*100).toFixed(0)}%`;

    document.getElementById(
      "activeGPUs"
    ).textContent=
      s.owned.length;

    document.getElementById(
      "efficiencyText"
    ).textContent=
      `${(eff*100).toFixed(0)}%`;

    document.getElementById(
      "efficiencyBar"
    ).style.width=
      `${Math.min(
        100,
        Math.max(
          0,
          eff*50
        )
      )}%`;

    document.getElementById(
      "capacityText"
    ).textContent=
      `${s.owned.length} / ${this.garage.capacity()}`;

    document.getElementById(
      "capacityBar"
    ).style.width=
      `${Math.min(
        100,
        s.owned.length/
        this.garage.capacity()*
        100
      )}%`;

    document.getElementById(
      "electricCost"
    ).textContent=
      `${m.electricityPerMinute().toFixed(6)} игровых BTC/мин`;

    document.getElementById(
      "garageVisualLevel"
    ).textContent=
      `УР. ${s.garage}`;

    document.getElementById(
      "rigCount"
    ).textContent=
      `${this.garage.rigs()} / ${this.garage.rigs()}`;

    const status=
      document.getElementById(
        "miningStatus"
      );

    status.textContent=
      m.running
        ?"● ОНЛАЙН"
        :"● ОФЛАЙН";

    status.className=
      `badge ${
        m.running
          ?"online"
          :"offline"
      }`;

    document.getElementById(
      "startMining"
    ).disabled=
      m.running;

    document.getElementById(
      "stopMining"
    ).disabled=
      !m.running;

    document.getElementById(
      "spins"
    ).textContent=
      s.stats.spins;

    document.getElementById(
      "wins"
    ).textContent=
      s.stats.wins;

    document.getElementById(
      "losses"
    ).textContent=
      s.stats.losses;

    document.getElementById(
      "biggestWin"
    ).textContent=
      s.stats.biggestWin.toFixed(4);

    document.getElementById(
      "totalSpent"
    ).textContent=
      s.stats.totalSpent.toFixed(4);

    document.getElementById(
      "prestigePoints"
    ).textContent=
      s.prestige;

    document.getElementById(
      "prestigeBonus"
    ).textContent=
      `${s.prestige*5}%`;

    document.getElementById(
      "inventoryCount"
    ).textContent=
      `${s.owned.length} видеокарт`;

    document.getElementById(
      "achievementCount"
    ).textContent=
      `${s.achievements.length} / ${ACHIEVEMENTS.length}`;

    this.updateGarageVisual();

    this.drawCharts();

  }

  updateGarageVisual(){

    const rigs=
      document.querySelectorAll(
        ".rig"
      );

    rigs.forEach(
      (r,i)=>{

        r.style.display=
          i<this.garage.rigs()
            ?"block"
            :"none";

        const stack=
          r.querySelector(
            ".gpu-stack"
          );

        stack.innerHTML="";

        const start=
          Math.floor(
            i*
            this.state.owned.length/
            Math.max(
              1,
              this.garage.rigs()
            )
          );

        const end=
          Math.floor(
            (i+1)*
            this.state.owned.length/
            Math.max(
              1,
              this.garage.rigs()
            )
          );

        const count=
          Math.min(
            4,
            Math.max(
              0,
              end-start
            )
          );

        for(
          let x=0;
          x<count;
          x++
        ){

          stack.innerHTML+=
            `<div class="gpu-mini"></div>`;

        }

      }
    );

    document.getElementById(
      "garageFan"
    ).classList.toggle(
      "off",
      !this.mining.running
    );

    document.querySelectorAll(
      ".gpu-fan"
    ).forEach(
      x=>{
        x.style.animationPlayState=
          this.mining.running
            ?"running"
            :"paused";
      }
    );

  }

  updateVisualState(){

    const garage=
      document.getElementById(
        "garageVisual"
      );

    garage.classList.toggle(
      "mining-off",
      !this.mining.running
    );

    this.updateUI();

  }

  drawCharts(){

    this.drawChart(
      "hashChart",
      this.history.hash
    );

    this.drawChart(
      "earnChart",
      this.history.earn
    );

  }

  drawChart(id,data){

    const c=
      document.getElementById(id);

    if(!c)return;

    const ctx=
      c.getContext("2d");

    const ratio=
      window.devicePixelRatio||1;

    const w=
      Math.max(
        1,
        c.clientWidth
      );

    const h=
      Math.max(
        1,
        c.clientHeight
      );

    c.width=w*ratio;

    c.height=h*ratio;

    ctx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

    ctx.clearRect(
      0,
      0,
      w,
      h
    );

    ctx.strokeStyle=
      "rgba(255,255,255,.06)";

    for(
      let y=20;
      y<h;
      y+=25
    ){

      ctx.beginPath();

      ctx.moveTo(
        0,
        y
      );

      ctx.lineTo(
        w,
        y
      );

      ctx.stroke();

    }

    if(!data.length){

      ctx.beginPath();

      ctx.moveTo(
        0,
        h-20
      );

      ctx.lineTo(
        w,
        h-20
      );

      ctx.stroke();

      return;

    }

    const max=
      Math.max(
        ...data,
        .000001
      );

    const min=
      Math.min(
        ...data,
        0
      );

    const grad=
      ctx.createLinearGradient(
        0,
        0,
        w,
        0
      );

    grad.addColorStop(
      0,
      "#00e5ff"
    );

    grad.addColorStop(
      1,
      "#9b5cff"
    );

    ctx.strokeStyle=grad;

    ctx.lineWidth=2;

    ctx.beginPath();

    data.forEach(
      (v,i)=>{

        const x=
          i/
          Math.max(
            1,
            data.length-1
          )*
          w;

        const y=
          h-15-
          (
            (v-min)/
            (max-min||1)
          )*
          (h-30);

        if(i){

          ctx.lineTo(
            x,
            y
          );

        }else{

          ctx.moveTo(
            x,
            y
          );

        }

      }
    );

    ctx.stroke();

  }

  renderAchievements(){

    const box=
      document.getElementById(
        "achievementGrid"
      );

    box.innerHTML=
      ACHIEVEMENTS.map(
        a=>{

          const unlocked=
            this.state.achievements
              .includes(
                a[0]
              );

          return `

            <div
              class="achievement ${
                unlocked
                  ?"unlocked"
                  :""
              }"
            >

              <h3>
                ${unlocked?"🏆":"🔒"}
                ${a[1]}
              </h3>

              <p>
                ${a[2]}
              </p>

            </div>

          `;

        }
      ).join("");

  }

  checkAchievements(){

    const s=this.state;

    const hash=
      this.mining.hashrate();

    const tests={

      firstGPU:
        s.owned.length>=1,

      firstRig:
        s.owned.length>=1&&
        this.mining.running,

      oneBTC:
        s.totalEarned>=1,

      tenGPU:
        s.owned.length>=10,

      garage5:
        s.garage>=5,

      hash1000:
        hash>=1000,

      millionaire:
        s.balance>=100,

      ultimate:
        s.garage>=5&&
        s.owned.length>=32

    };

    for(
      const [id,name]
      of ACHIEVEMENTS
    ){

      if(
        tests[id]&&
        !s.achievements.includes(id)
      ){

        s.achievements.push(id);

        this.showAchievement(name);

        this.sound(
          "achievement"
        );

      }

    }

    this.renderAchievements();

  }

  showAchievement(name){

    const popup=
      document.getElementById(
        "achievementPopup"
      );

    document.getElementById(
      "achievementPopupText"
    ).textContent=name;

    popup.classList.remove(
      "show"
    );

    void popup.offsetWidth;

    popup.classList.add(
      "show"
    );

  }

  notify(title,text){

    const box=
      document.getElementById(
        "notifications"
      );

    const el=
      document.createElement(
        "div"
      );

    el.className="toast";

    const titleEl=
      document.createElement(
        "b"
      );

    const textEl=
      document.createElement(
        "span"
      );

    titleEl.textContent=title;

    textEl.textContent=text;

    el.appendChild(titleEl);

    el.appendChild(textEl);

    box.appendChild(el);

    setTimeout(
      ()=>el.remove(),
      3500
    );

  }

  sound(type){

    if(!this.state.settings.sound){
      return;
    }

    try{

      this.audio=
        this.audio||
        new (
          window.AudioContext||
          window.webkitAudioContext
        )();

      const ctx=this.audio;

      if(
        ctx.state==="suspended"
      ){

        ctx.resume()
          .catch(
            ()=>{}
          );

      }

      const osc=
        ctx.createOscillator();

      const gain=
        ctx.createGain();

      const now=
        ctx.currentTime;

      const freqs={

        click:420,
        purchase:620,
        upgrade:760,
        achievement:880,
        spin:180,
        win:960,
        start:520

      };

      osc.frequency.value=
        freqs[type]||420;

      osc.type=
        type==="spin"
          ?"sawtooth"
          :"sine";

      gain.gain.setValueAtTime(
        .0001,
        now
      );

      gain.gain.exponentialRampToValueAtTime(
        type==="spin"
          ?.035
          :.055,
        now+.01
      );

      gain.gain.exponentialRampToValueAtTime(
        .0001,
        now+
        (
          type==="spin"
            ?.18
            :.1
        )
      );

      osc.connect(gain);

      gain.connect(
        ctx.destination
      );

      osc.start(now);

      osc.stop(
        now+.2
      );

    }catch(e){}

  }

  applySettings(){

    const s=
      this.state.settings;

    document.getElementById(
      "soundToggle"
    ).classList.toggle(
      "on",
      s.sound
    );

    document.getElementById(
      "animationToggle"
    ).classList.toggle(
      "on",
      s.animations
    );

    document.getElementById(
      "particleToggle"
    ).classList.toggle(
      "on",
      s.particles
    );

    document.getElementById(
      "reducedToggle"
    ).classList.toggle(
      "on",
      s.reduced
    );

    document.getElementById(
      "muteBtn"
    ).textContent=
      s.sound
        ?"🔊"
        :"🔇";

    document.body.classList.toggle(
      "no-animations",
      !s.animations
    );

    document.body.classList.toggle(
      "reduced",
      s.reduced
    );

    document.getElementById(
      "particles"
    ).style.display=
      s.particles
        ?"block"
        :"none";

  }

  safeNum(n){

    return Number.isFinite(
      Number(n)
    )
      ?Number(n)
      :0;

  }

}


/* =========================================================
   EXTENDED SYSTEMS — integrated into the existing game
========================================================= */

const GPU_IMAGE_PATH = id => "";

function fmtBTC(v){ return Number(v||0).toFixed(6); }
function fmtRUB(v){ return `${Math.round(Number(v||0)).toLocaleString("ru-RU")} ₽`; }
function fmtDate(v){ const d=new Date(v); return Number.isNaN(d.getTime())?"—":d.toLocaleDateString("ru-RU"); }
function fmtTime(sec){ sec=Math.max(0,Math.floor(Number(sec)||0)); const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60); return h?`${h} ч ${m} мин`: `${m} мин`; }
function highestTierGPU(){ return GPU_TYPES.reduce((a,b)=>a.hash>b.hash?a:b); }
function topTierCount(state){ const top=highestTierGPU(); return state.owned.filter(g=>g.typeId===top.id).length; }
function gpuSellPrice(g){ const t=GPU_TYPES.find(x=>x.id===g.typeId)||GPU_TYPES[0]; const level=Math.max(1,Number(g.level)||1); const cond=Math.max(ECONOMY.sellConditionFloor,Number(g.condition)||0)/100; return t.price*t.resale*(1+(level-1)*ECONOMY.sellUpgradeRecovery*.08)*cond; }
function gpuUpgradePrice(g){ const t=GPU_TYPES.find(x=>x.id===g.typeId)||GPU_TYPES[0]; const level=Math.max(1,Number(g.level)||1); return t.upgradeBase*Math.pow(1.62,level-1); }
function gpuHashAfter(g){ const t=GPU_TYPES.find(x=>x.id===g.typeId)||GPU_TYPES[0]; const level=Math.min(ECONOMY.maxGpuLevel,(Number(g.level)||1)+1); const cond=.72+(Math.max(0,Math.min(100,Number(g.condition)||0))/100)*.28; return t.hash*(1+(level-1)*.18)*cond; }
function ensureStateExtended(state){
  const base=freshState();
  state.rubBalance=Number.isFinite(Number(state.rubBalance))?Math.max(0,Number(state.rubBalance)):base.rubBalance;
  state.exchangeRate=Number.isFinite(Number(state.exchangeRate))?Number(state.exchangeRate):base.exchangeRate;
  state.previousExchangeRate=Number.isFinite(Number(state.previousExchangeRate))?Number(state.previousExchangeRate):state.exchangeRate;
  state.rateHistory=Array.isArray(state.rateHistory)?state.rateHistory.map(Number).filter(Number.isFinite).slice(-30):[state.exchangeRate];
  if(!state.rateHistory.length)state.rateHistory=[state.exchangeRate];
  state.playtime=Math.max(0,Number(state.playtime)||0);
  state.profileCreatedAt=state.profileCreatedAt||Date.now();
  state.maxBalance=Math.max(Number(state.maxBalance)||0,Number(state.balance)||0);
  state.maxHashrate=Math.max(Number(state.maxHashrate)||0,0);
  state.totalSpent=Math.max(0,Number(state.totalSpent)||0);
  state.currentTheme=state.currentTheme||"cyan";
  state.stats={...base.stats,...(state.stats||{})};
  return state;
}

const ORIGINAL_GAME_BIND=Game.prototype.bind;
const ORIGINAL_GAME_RENDER_ALL=Game.prototype.renderAll;
const ORIGINAL_GAME_UPDATE_UI=Game.prototype.updateUI;
const ORIGINAL_GAME_RENDER_INVENTORY=Game.prototype.renderInventory;
const ORIGINAL_GAME_RENDER_MARKET=Game.prototype.renderMarket;
const ORIGINAL_GAME_RENDER_UPGRADES=Game.prototype.renderUpgrades;
const ORIGINAL_GAME_SAVE=Game.prototype.save;

Game.prototype.merge=function(base,loaded){
  const result=Game.prototype.__originalMerge.call(this,base,loaded);
  ensureStateExtended(result);
  result.owned.forEach(g=>{g.level=Math.min(ECONOMY.maxGpuLevel,Math.max(1,Number(g.level)||1));});
  return result;
};
Game.prototype.__originalMerge=Game.prototype.merge;

// The assignment above would recurse if called directly; restore a safe original reference.
// This function is replaced immediately below with a standalone compatibility merge.
Game.prototype.merge=function(base,loaded){
  if(!loaded||typeof loaded!=="object")return ensureStateExtended({...base});
  const r={...base,...loaded};
  r.upgrades={...base.upgrades,...(loaded.upgrades||{})};
  r.stats={...base.stats,...(loaded.stats||{})};
  r.settings={...base.settings,...(loaded.settings||{})};
  r.owned=Array.isArray(loaded.owned)?loaded.owned.map(g=>({typeId:GPU_TYPES.some(t=>t.id===g.typeId)?g.typeId:"1660",level:Math.min(ECONOMY.maxGpuLevel,Math.max(1,Math.floor(Number(g.level)||1))),condition:Math.max(0,Math.min(100,Number(g.condition)||0))})):[];
  r.achievements=Array.isArray(loaded.achievements)?loaded.achievements.filter(id=>ACHIEVEMENTS.some(a=>a[0]===id)):[];
  r.balance=Math.max(0,Number(r.balance)||0); r.totalEarned=Math.max(0,Number(r.totalEarned)||0); r.garage=Math.min(5,Math.max(1,Math.floor(Number(r.garage)||1))); r.prestige=Math.max(0,Math.floor(Number(r.prestige)||0));
  Object.keys(base.upgrades).forEach(k=>r.upgrades[k]=Math.max(0,Math.floor(Number(r.upgrades[k])||0)));
  r.tutorialCompleted=!!r.tutorialCompleted;
  return ensureStateExtended(r);
};

GPU.prototype.upgradeCost=function(){ return gpuUpgradePrice({typeId:this.type().id,level:this.level,condition:this.condition}); };
GPU.prototype.type=function(){ return GPU_TYPES.find(x=>x.id===this.typeId)||GPU_TYPES[0]; };
Garage.prototype.capacity=function(){ return this.data().slots + this.game.state.upgrades.storage*ECONOMY.storagePerLevel; };

function extendedRenderMarket(){
  const box=document.getElementById("marketList"); if(!box)return;
  box.innerHTML=GPU_TYPES.map(t=>`<div class="gpu-card">
    <div class="gpu-visual gpu-image-wrap"><div class="gpu-image-fallback">${t.name}</div></div>
    <div class="gpu-name">${t.name}</div>
    <div class="gpu-details"><div>ХЕШРЕЙТ<b>${t.hash} МХ/с</b></div><div>ПИТАНИЕ<b>${t.power} Вт</b></div><div>ТЕМП.<b>${t.temp}°C</b></div></div>
    <div class="card-actions"><button class="btn" onclick="game.buyGPU('${t.id}')" ${game.state.owned.length>=game.garage.capacity()?"disabled":""}>КУПИТЬ <span class="price">${t.price.toFixed(3)} BTC</span></button></div>
  </div>`).join("");
}

Game.prototype.renderMarket=extendedRenderMarket;

Game.prototype.buyGPU=function(typeId){
  const type=GPU_TYPES.find(x=>x.id===typeId); if(!type)return;
  if(this.state.owned.length>=this.garage.capacity()){this.notify("Недостаточно места","Недостаточно места в гараже.");return;}
  if(this.state.balance+1e-12<type.price){this.notify("Недостаточно игровых BTC","На балансе недостаточно вымышленных средств.");return;}
  this.state.balance-=type.price; this.state.totalSpent+=type.price; this.state.stats.purchasedGPUs++; this.state.owned.push({typeId,level:1,condition:100});
  this.state.maxBalance=Math.max(this.state.maxBalance,this.state.balance); this.sound("purchase"); this.notify("Видеокарта куплена",`${type.name} добавлена в ваш гараж.`); this.renderAll(); this.checkAchievements(); this.save();
};

Game.prototype.renderInventory=function(){
  const box=document.getElementById("inventoryGrid"); if(!box)return;
  const badge=document.getElementById("inventoryCount"), cap=document.getElementById("garageCapacityBadge");
  if(badge)badge.textContent=`${this.state.owned.length} видеокарт`; if(cap)cap.textContent=`Занято: ${this.state.owned.length} / ${this.garage.capacity()}`;
  if(!this.state.owned.length){box.innerHTML=`<div class="muted" style="padding:30px">В гараже пока нет видеокарт. Откройте рынок и купите первую видеокарту.</div>`;return;}
  box.innerHTML=this.state.owned.map((g,i)=>{const t=GPU_TYPES.find(x=>x.id===g.typeId)||GPU_TYPES[0];const gpu=new GPU(g.typeId,g.level,g.condition);const up=g.level>=ECONOMY.maxGpuLevel?null:gpuUpgradePrice(g);const sell=gpuSellPrice(g);const repair=Math.max(0,(100-g.condition)*t.price*.12);const next=g.level>=ECONOMY.maxGpuLevel?gpu.hash():gpuHashAfter(g);return `<div class="inventory-card">
    <div class="gpu-image-wrap"><div class="gpu-image-fallback">${t.name}</div></div>
    <div style="display:flex;justify-content:space-between;gap:10px"><div><b>${t.name}</b><div class="muted" style="font-size:10px">Видеокарта №${i+1}</div></div><span class="badge">УР. ${g.level}</span></div>
    <div class="condition"><i style="width:${Math.max(0,g.condition)}%"></i></div>
    <div class="inv-stats"><span>ХЕШРЕЙТ<b>${gpu.hash().toFixed(1)} МХ/с</b></span><span>СЛЕД. ХЕШРЕЙТ<b>${next.toFixed(1)} МХ/с</b></span><span>ПИТАНИЕ<b>${gpu.power().toFixed(0)} Вт</b></span><span>ТЕМПЕРАТУРА<b>${gpu.temp().toFixed(0)}°C</b></span><span>СОСТОЯНИЕ<b>${g.condition.toFixed(0)}%</b></span><span>УЛУЧШЕНИЕ<b>${up===null?"МАКС.":fmtBTC(up)+" BTC"}</b></span><span>ПРОДАЖА<b>${fmtBTC(sell)} BTC</b></span><span>РЕМОНТ<b>${fmtBTC(repair)} BTC</b></span></div>
    <div class="inventory-actions"><button class="btn" onclick="game.repairGPU(${i})" ${repair<=0||this.state.balance+1e-12<repair?"disabled":""}>РЕМОНТ</button><button class="btn" onclick="game.upgradeGPU(${i})" ${up===null||this.state.balance+1e-12<up?"disabled":""}>УЛУЧШИТЬ</button><button class="btn primary" onclick="game.upgradeGPU(${i},true)" ${up===null||this.state.balance+1e-12<up?"disabled":""}>УЛУЧИТЬ МАКСИМАЛЬНО</button><button class="btn danger" onclick="game.sellGPU(${i})">ПРОДАТЬ</button></div>
  </div>`;}).join("");
};

Game.prototype.upgradeGPU=function(index,maximize=false){
  const g=this.state.owned[index]; if(!g)return; let count=0,total=0;
  while(g.level<ECONOMY.maxGpuLevel){const cost=gpuUpgradePrice(g);if(this.state.balance+1e-12<cost)break;this.state.balance-=cost;this.state.totalSpent+=cost;g.level++;count++;total+=cost;}
  if(!count){this.state.stats.failedUpgrades++;this.notify("Недостаточно игровых BTC",`Следующее улучшение стоит ${fmtBTC(gpuUpgradePrice(g))} BTC.`);this.save();return;}
  this.state.stats.gpuUpgrades+=count;this.state.stats.successfulUpgrades+=count;this.state.maxBalance=Math.max(this.state.maxBalance,this.state.balance);this.sound("upgrade");
  // No intrusive success popup for GPU upgrades.
  this.renderAll();this.checkAchievements();this.save();
};

Game.prototype.sellGPU=function(index){
  const g=this.state.owned[index];if(!g)return;const refund=gpuSellPrice(g);const t=GPU_TYPES.find(x=>x.id===g.typeId)||GPU_TYPES[0];this.state.balance+=refund;this.state.stats.soldGPUs++;this.state.owned.splice(index,1);this.state.maxBalance=Math.max(this.state.maxBalance,this.state.balance);this.notify("Видеокарта продана",`${t.name}: +${fmtBTC(refund)} игровых BTC.`);this.renderAll();this.checkAchievements();this.save();
};

function upgradeCostForSystem(game,key){const level=game.state.upgrades[key];return .18*Math.pow(1.65,level)*(key==="storage"?1.4:1);}
Game.prototype.repairGPU=function(index){const g=this.state.owned[index];if(!g||g.condition>=99.99)return;const t=GPU_TYPES.find(x=>x.id===g.typeId)||GPU_TYPES[0];const cost=Math.max(0,(100-g.condition)*t.price*.12);if(this.state.balance+1e-12<cost){this.notify("Недостаточно игровых BTC",`Ремонт стоит ${fmtBTC(cost)} BTC.`);return;}this.state.balance-=cost;this.state.totalSpent+=cost;g.condition=100;this.renderAll();this.save();};

Game.prototype.renderUpgrades=function(){
  const box=document.getElementById("upgradeGrid");if(!box)return;
  box.innerHTML=Object.entries(UPGRADE_DEFS).map(([key,d])=>{let level=this.state.upgrades[key],cost,disabled=false,current,next;if(key==="size"){current=`Уровень гаража ${this.state.garage}`;next=this.state.garage<5?`Уровень гаража ${this.state.garage+1}`:"МАКСИМАЛЬНЫЙ УРОВЕНЬ";cost=this.garage.cost();disabled=this.state.garage>=5;}else{current=`Уровень ${level}`;next=`Уровень ${level+1}`;cost=upgradeCostForSystem(this,key);}return `<div class="upgrade-card"><div class="upgrade-head"><strong>${d.icon} ${d.name}</strong><span class="badge">УР. ${key==="size"?this.state.garage:level}</span></div><div class="upgrade-info">${d.desc}<br><br><span class="muted">Сейчас:</span> ${current}<br><span class="muted">Следующий:</span> ${next}${key==="storage"?`<br><span class="muted">Вместимость:</span> ${this.garage.capacity()} GPU`:""}</div><div class="upgrade-row"><span class="cost">${Number.isFinite(cost)?fmtBTC(cost)+" игровых BTC":"МАКС."}</span><button class="btn" onclick="game.buyUpgrade('${key}')" ${disabled?"disabled":""}>УЛУЧШИТЬ</button></div></div>`;}).join("");
};
Game.prototype.buyUpgrade=function(key){if(!UPGRADE_DEFS[key])return;if(key==="size"){const before=this.state.garage;if(!this.garage.upgrade())return;this.state.totalSpent+=GARAGE_LEVELS[this.state.garage-1].cost;this.state.stats.garageUpgrades++;this.notify("Гараж улучшен",`Открыт ${this.state.garage}-й уровень и новые места для GPU.`);this.renderAll();this.save();return;}const cost=upgradeCostForSystem(this,key);if(this.state.balance+1e-12<cost){this.notify("Недостаточно игровых BTC",`Нужно ${fmtBTC(cost)} BTC.`);return;}this.state.balance-=cost;this.state.totalSpent+=cost;this.state.upgrades[key]++;this.renderAll();this.save();};

// Replace the original garage upgrade so statistics and capacity remain consistent.
Garage.prototype.upgrade=function(){if(!this.canUpgrade())return false;const cost=this.cost();if(this.game.state.balance+1e-12<cost)return false;this.game.state.balance-=cost;this.game.state.garage++;this.game.sound("upgrade");return true;};

function prestigePanel(game){const top=highestTierGPU(),count=topTierCount(game.state),g=game.state.garage,ok=g>=ECONOMY.prestige.garageLevel&&count>=ECONOMY.prestige.requiredTopGPUs;const box=document.getElementById("prestigeRequirements");if(!box)return;box.innerHTML=`<b>Условия престижа</b><div class="prestige-req-grid"><div class="req-card ${g>=5?"ok":"bad"}">Гараж: <b>${g} / 5</b></div><div class="req-card ${count>=10?"ok":"bad"}">${top.name}: <b>${count} / 10</b></div><div class="req-card ${ok?"ok":"bad"}">Статус: <b>${ok?"ДОСТУПЕН":"НЕДОСТУПЕН"}</b></div></div>`;const p=document.getElementById("prestigeBtn");if(p)p.disabled=!ok;}

Game.prototype.renderProfile=function(){ensureStateExtended(this.state);const accounts=AccountSystem.getAccounts(),key=AccountSystem.current(),acc=key?accounts[key]:null;const grid=document.getElementById("profileGrid");if(!grid)return;const value=()=>this.state.owned.reduce((a,g)=>a+gpuSellPrice(g),0);const stats=[
["Текущий баланс",fmtBTC(this.state.balance)+" BTC"],["Всего заработано",fmtBTC(this.state.totalEarned)+" BTC"],["Всего потрачено",fmtBTC(this.state.totalSpent)+" BTC"],["Стоимость GPU",fmtBTC(value())+" BTC"],["Количество GPU",String(this.state.owned.length)],["Общий хешрейт",this.mining.hashrate().toFixed(1)+" МХ/с"],["Уровень гаража",String(this.state.garage)],["Улучшений GPU",String(this.state.stats.gpuUpgrades)],["Достижения",`${this.state.achievements.length} / ${ACHIEVEMENTS.length}`],["Престиж",String(this.state.prestige)],["Куплено GPU",String(this.state.stats.purchasedGPUs)],["Продано GPU",String(this.state.stats.soldGPUs)],["Улучшений гаража",String(this.state.stats.garageUpgrades)],["Максимальный баланс",fmtBTC(this.state.maxBalance)+" BTC"],["Максимальный хешрейт",this.state.maxHashrate.toFixed(1)+" МХ/с"],["Попыток апгрейдера",String(this.state.stats.attempts)],["Игровое время",fmtTime(this.state.playtime)],["Game RUB",fmtRUB(this.state.rubBalance)],["Победы колеса",String(this.state.stats.wins)],["Выиграно в мини-играх",fmtBTC(this.state.stats.totalWon)+" BTC"]];grid.innerHTML=stats.map(x=>`<div class="profile-stat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join("");document.getElementById("profileUsername").textContent=acc?.username||"—";document.getElementById("profileCreatedAt").textContent=fmtDate(acc?.createdAt||this.state.profileCreatedAt);document.getElementById("profilePlaytime").textContent=fmtTime(this.state.playtime);prestigePanel(this);document.body.classList.remove("theme-purple","theme-red","theme-white","theme-pink");if(this.state.currentTheme&&this.state.currentTheme!=="cyan")document.body.classList.add(`theme-${this.state.currentTheme}`);}

Game.prototype.updateExchange=function(){ensureStateExtended(this.state);const rate=this.state.exchangeRate,prev=this.state.previousExchangeRate,change=prev?(rate-prev)/prev*100:0;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set("exchangeRateValue",fmtRUB(rate));set("exchangePrevRate",fmtRUB(prev));set("exchangeChange",`${change>=0?"+":""}${change.toFixed(2)}%`);set("exchangeDirection",change>0.001?"▲ РОСТ":change<-0.001?"▼ ПАДЕНИЕ":"→ СТАБИЛЬНО");set("exchangeBTCBalance",fmtBTC(this.state.balance));set("exchangeRUBBalance",fmtRUB(this.state.rubBalance));const bi=Number(document.getElementById("btcToRubInput")?.value)||0,ri=Number(document.getElementById("rubToBtcInput")?.value)||0;set("btcToRubResult",`≈ ${fmtRUB(bi*rate)}`);set("rubToBtcResult",`≈ ${fmtBTC(ri/rate)} BTC`);this.drawExchangeChart();}
Game.prototype.changeExchangeRate=function(){const e=ECONOMY.exchange;const old=this.state.exchangeRate;const factor=1+(Math.random()*2-1)*(e.stepPercent/100);this.state.previousExchangeRate=old;this.state.exchangeRate=Math.max(e.min,Math.min(e.max,old*factor));this.state.rateHistory=[...(this.state.rateHistory||[]),this.state.exchangeRate].slice(-30);this.save();this.updateExchange();};
Game.prototype.exchangeBTCtoRUB=function(){const input=document.getElementById("btcToRubInput"),amount=Math.max(0,Number(input?.value)||0);if(amount<=0||amount>this.state.balance){this.notify("Недостаточно BTC","Введите корректное количество Game BTC.");return;}const fee=ECONOMY.exchange.fee, rub=amount*this.state.exchangeRate*(1-fee);this.state.balance-=amount;this.state.rubBalance+=rub;this.state.totalSpent+=amount;this.state.stats.totalRubEarned+=rub;this.updateUI();this.save();};
Game.prototype.exchangeRUBtoBTC=function(){const input=document.getElementById("rubToBtcInput"),rub=Math.max(0,Number(input?.value)||0);if(rub<=0||rub>this.state.rubBalance){this.notify("Недостаточно RUB","Введите корректное количество игровых рублей.");return;}const btc=(rub/this.state.exchangeRate)*(1-ECONOMY.exchange.fee);this.state.rubBalance-=rub;this.state.balance+=btc;this.state.stats.totalRubSpent+=rub;this.updateUI();this.save();};
Game.prototype.drawExchangeChart=function(){const c=document.getElementById("exchangeChart");if(!c)return;const ctx=c.getContext("2d"),ratio=devicePixelRatio||1,w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight);c.width=w*ratio;c.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);const data=this.state.rateHistory||[];if(data.length<2)return;const min=Math.min(...data),max=Math.max(...data);ctx.strokeStyle="#00e5ff";ctx.lineWidth=2;ctx.beginPath();data.forEach((v,i)=>{const x=i/(data.length-1)*w,y=h-20-((v-min)/(max-min||1))*(h-40);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();};

Game.prototype.updateUpgrader=function(){const bet=Math.max(0,Number(document.getElementById("upgraderBet")?.value)||0),target=Math.max(0,Number(document.getElementById("upgraderTarget")?.value)||0),mult=bet>0?target/bet:0;let chance=target>0?(bet/target)*100:0;chance=Math.min(ECONOMY.upgrader.maxChance,Math.max(0,chance));const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set("upgraderBalance",`${fmtBTC(this.state.balance)} BTC`);set("upgraderLoss",`${fmtBTC(Math.min(bet,this.state.balance))} BTC`);set("upgraderMultiplier",`${mult.toFixed(2)}×`);set("upgraderProfit",`${fmtBTC(Math.max(0,target-bet))} BTC`);set("upgradeChance",`${chance.toFixed(2)}%`);set("upgraderRisk",chance>=60?"НИЗКИЙ":chance>=30?"СРЕДНИЙ":chance>=1?"ВЫСОКИЙ":"НЕДОПУСТИМЫЙ");const ring=document.getElementById("upgradeRing");if(ring)ring.style.background=`conic-gradient(var(--green) 0deg,var(--green) ${chance*3.6}deg,#202630 ${chance*3.6}deg,#202630 360deg)`;const btn=document.getElementById("upgraderPlay");if(btn)btn.disabled=!(bet>0&&target>bet&&bet<=this.state.balance&&chance>=ECONOMY.upgrader.minChance&&chance<=ECONOMY.upgrader.maxChance);};
Game.prototype.playUpgrader=function(){const bet=Math.max(0,Number(document.getElementById("upgraderBet")?.value)||0),target=Math.max(0,Number(document.getElementById("upgraderTarget")?.value)||0);const mult=bet>0?target/bet:0;const chance=target>0?Math.min(ECONOMY.upgrader.maxChance,Math.max(0,(bet/target)*100)):0;if(!(bet>0&&target>bet&&bet<=this.state.balance&&chance>=1&&chance<=80))return;const won=Math.random()*100<chance;this.state.stats.attempts++;this.state.balance-=bet;const ring=document.getElementById("upgradeRing"),res=document.getElementById("upgraderResult"),btn=document.getElementById("upgraderPlay");if(btn)btn.disabled=true;if(ring){ring.classList.remove("win","loss","spinning");void ring.offsetWidth;ring.classList.add("spinning");}setTimeout(()=>{if(won){this.state.balance+=target;this.state.stats.wins++;this.state.stats.totalWon+=target;this.state.stats.biggestWin=Math.max(this.state.stats.biggestWin,target);this.state.stats.highestMultiplier=Math.max(this.state.stats.highestMultiplier,mult);if(ring)ring.classList.add("win");if(res)res.textContent=`УСПЕХ — получено ${fmtBTC(target)} BTC`;this.sound("win");}else{this.state.stats.losses++;if(ring)ring.classList.add("loss");if(res)res.textContent=`НЕУДАЧА — потеряно ${fmtBTC(bet)} BTC`;}this.state.maxBalance=Math.max(this.state.maxBalance,this.state.balance);this.renderProfile();this.updateUpgrader();this.save();},3200);};

Game.prototype.renderRoulettePrizeValues=function(){};
Roulette.prototype.spin=async function(){if(this.busy)return;const game=this.game,input=document.getElementById("betInput");let bet=Number(input.value);if(!Number.isFinite(bet)||bet<=0||bet>game.state.balance){game.notify("Неверная ставка","Введите ставку не выше текущего баланса.");return;}bet=Math.floor(bet*1e6)/1e6;this.busy=true;document.getElementById("spinBtn").disabled=true;game.state.balance-=bet;game.state.stats.spins++;game.state.stats.totalSpent+=bet;const slots=[0,1,2].map(i=>document.getElementById(`slot${i}`));slots.forEach(x=>x.classList.add("spinning"));const final=[...Array(3)].map(()=>this.symbols[Math.floor(Math.random()*this.symbols.length)]);const delays=[900,1450,2000];const timers=[];for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,delays[i]));slots[i].textContent=final[i];slots[i].classList.remove("spinning");}const mult=this.multiplier(...final),payout=bet*mult;if(mult>0){game.state.balance+=payout;game.state.stats.wins++;game.state.stats.totalWon+=payout;game.state.stats.biggestWin=Math.max(game.state.stats.biggestWin,payout);game.state.stats.highestMultiplier=Math.max(game.state.stats.highestMultiplier,mult);game.sound("win");document.getElementById("rouletteResult").textContent=`ПОБЕДА — ${final.join(" ")} → +${fmtBTC(payout)} BTC`;}else{game.state.stats.losses++;document.getElementById("rouletteResult").textContent=`НЕУДАЧА — ${final.join(" ")} → ставка потеряна.`;}game.state.maxBalance=Math.max(game.state.maxBalance,game.state.balance);this.busy=false;document.getElementById("spinBtn").disabled=false;game.renderAll();game.save();};

Game.prototype.updatePrestigeButton=function(){const ok=this.state.garage===5&&topTierCount(this.state)>=10;const b=document.getElementById("prestigeBtn");if(b)b.disabled=!ok;prestigePanel(this);};

const originalUpdateGarageVisual=Game.prototype.updateGarageVisual;
Game.prototype.updateUI=function(){ensureStateExtended(this.state);const r=ORIGINAL_GAME_UPDATE_UI.call(this);this.state.maxBalance=Math.max(this.state.maxBalance,this.state.balance);this.state.maxHashrate=Math.max(this.state.maxHashrate,this.mining.hashrate());this.renderProfile();this.updateExchange();this.updateUpgrader();this.updatePrestigeButton();return r;};
Game.prototype.renderAll=function(){const r=ORIGINAL_GAME_RENDER_ALL.call(this);this.renderProfile();this.updateExchange();this.updateUpgrader();return r;};

function bindExtendedUI(){
  document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{game.state.currentTheme=b.dataset.theme;game.renderProfile();game.save();});
  ["btcToRubInput","rubToBtcInput"].forEach(id=>document.getElementById(id)?.addEventListener("input",()=>game.updateExchange()));
  document.getElementById("exchangeAllToRub")?.addEventListener("click",()=>game.exchangeBTCtoRUB());
  document.getElementById("exchangeAllToBtc")?.addEventListener("click",()=>game.exchangeRUBtoBTC());
  document.querySelectorAll("[data-upbet]").forEach(b=>b.onclick=()=>{const v=b.dataset.upbet,el=document.getElementById("upgraderBet");if(v==="min")el.value=Math.min(.001,game.state.balance);else if(v==="half")el.value=(game.state.balance/2).toFixed(6);else if(v==="double")el.value=(Number(el.value||0)*2).toFixed(6);else if(v==="max")el.value=game.state.balance.toFixed(6);else el.value=v;game.updateUpgrader();});
  ["upgraderBet","upgraderTarget"].forEach(id=>document.getElementById(id)?.addEventListener("input",()=>game.updateUpgrader()));
  document.getElementById("upgraderPlay")?.addEventListener("click",()=>game.playUpgrader());
  let clicks=0,last=0;const user=document.getElementById("currentUsername");user?.addEventListener("click",()=>{const now=Date.now();clicks=now-last<1500?clicks+1:1;last=now;if(clicks===3){clicks=0;game.openAdminPanel();}});
}

Game.prototype.openAdminPanel=function(){let modal=document.getElementById("adminModal");if(!modal){modal=document.createElement("div");modal.id="adminModal";modal.className="modal-backdrop";modal.innerHTML=`<div class="modal"><h2>Панель администратора</h2><p class="muted">Локальная панель разработчика. Изменения относятся только к текущему аккаунту.</p><div class="modal-actions" style="flex-wrap:wrap"><button class="btn" id="adminBTC">+1 BTC</button><button class="btn" id="adminRub">+100 000 RUB</button><button class="btn" id="adminGPU">Выдать RTX 4090</button><button class="btn" id="adminGarage">Максимальный гараж</button><button class="btn" id="adminTop">Выдать 10 RTX 4090</button><button class="btn danger" id="adminClose">ЗАКРЫТЬ</button></div></div>`;document.body.appendChild(modal);document.getElementById("adminBTC").onclick=()=>{game.state.balance+=1;game.save();game.updateUI()};document.getElementById("adminRub").onclick=()=>{game.state.rubBalance+=100000;game.save();game.updateUI()};document.getElementById("adminGPU").onclick=()=>{if(game.state.owned.length<game.garage.capacity())game.state.owned.push({typeId:"4090",level:1,condition:100});game.save();game.renderAll()};document.getElementById("adminGarage").onclick=()=>{game.state.garage=5;game.save();game.renderAll()};document.getElementById("adminTop").onclick=()=>{for(let i=0;i<10&&game.state.owned.length<game.garage.capacity();i++)game.state.owned.push({typeId:"4090",level:1,condition:100});game.save();game.renderAll()};document.getElementById("adminClose").onclick=()=>modal.classList.add("hidden");}modal.classList.remove("hidden");};

const oldBind=Game.prototype.bind;
Game.prototype.bind=function(){oldBind.call(this);bindExtendedUI();const originalPrestige=document.getElementById("prestigeBtn");if(originalPrestige)originalPrestige.onclick=()=>{const ok=this.state.garage===5&&topTierCount(this.state)>=10;if(!ok){this.notify("Престиж недоступен","Нужен 5-й уровень гаража и 10 видеокарт RTX 4090.");return;}if(!confirm("Престиж сбросит гараж, GPU и обычные улучшения. Уровень престижа сохранится. Продолжить?"))return;this.mining.stop();this.state.owned=[];this.state.garage=1;Object.keys(this.state.upgrades).forEach(k=>this.state.upgrades[k]=0);this.state.prestige++;this.state.balance=1;this.renderAll();this.save();this.notify("Престиж активирован",`Уровень престижа: ${this.state.prestige}.`);};};

// Add the requested garage-level explanation without removing the existing tutorial.
TUTORIAL.splice(5,0,{icon:"🏭",title:"Как повысить уровень гаража",text:"1. Заработайте Game BTC. 2. Купите видеокарты и получайте пассивный доход. 3. Откройте «Улучшения гаража». 4. Накопите нужный баланс. 5. Купите следующий уровень гаража. 6. Вместимость GPU увеличится. Улучшение «Хранилище» также добавляет места."});

// Track active play time and periodically move the fictional exchange rate.
let extendedLastTick=Date.now();
setInterval(()=>{if(AccountSystem.current()&&document.visibilityState==="visible"){const now=Date.now();game.state.playtime+=Math.max(0,Math.min(5,(now-extendedLastTick)/1000));extendedLastTick=now;game.save();game.renderProfile();}},1000);
setInterval(()=>{if(AccountSystem.current())game.changeExchangeRate();},60000);
document.addEventListener("visibilitychange",()=>{extendedLastTick=Date.now();});

/* =========================================================
   START
========================================================= */

const game=
  new Game();

window.game=game;

game.init();

/* =========================================================
   PARTICLES
========================================================= */

(function createParticles(){

  const box=
    document.getElementById(
      "particles"
    );

  for(
    let i=0;
    i<45;
    i++
  ){

    const p=
      document.createElement(
        "i"
      );

    p.className="particle";

    p.style.left=
      Math.random()*100+
      "%";

    p.style.animationDuration=
      8+
      Math.random()*18+
      "s";

    p.style.animationDelay=
      -Math.random()*20+
      "s";

    p.style.opacity=
      .08+
      Math.random()*.3;

    box.appendChild(p);

  }

})();

/* =========================================================
   FPS
========================================================= */

setInterval(
  ()=>{

    const value=
      game.mining.running
        ?Math.floor(
          118+
          Math.random()*27
        )
        :144;

    document.getElementById(
      "fps"
    ).textContent=value;

  },
  1000
);

/* =========================================================
   EVENTS
========================================================= */

setInterval(
  ()=>{

    if(
      !game.mining.running||
      game.state.owned.length===0
    ){
      return;
    }

    const events=[

      [
        "Обслуживание охлаждения",
        "Система охлаждения получила небольшую вымышленную оптимизацию."
      ],

      [
        "Оптимизация завершена",
        "Работа майнинга стала немного стабильнее."
      ],

      [
        "Находка в гараже",
        "Обнаружены запасные вымышленные детали оборудования."
      ],

      [
        "Температура стабилизирована",
        "Воздушный поток в гараже был автоматически перенастроен."
      ]

    ];

    const e=
      events[
        Math.floor(
          Math.random()*
          events.length
        )
      ];

    game.notify(
      e[0],
      e[1]
    );

  },
  45000
);

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
  "resize",
  ()=>game.drawCharts()
);

/* =========================================================
   AUTOSAVE
========================================================= */

setInterval(
  ()=>{

    if(
      AccountSystem.current()
    ){

      game.save();

    }

  },
  10000
);
