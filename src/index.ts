const bt1 = document.getElementById("ct1");
const bt2 = document.getElementById("ct2");
const bt3 = document.getElementById("ct3");

const startCutscene = async (cutscene: any) => {
  if (cutscene.events.length == 0 || cutscene.who.length == 0) return;

  cutscene.who.forEach((cs: any) => {
    //i need to set the cutscene flag for each object
    const goIndex = gameObjects.findIndex((go: any) => {
      return go.id == cs;
    });
    gameObjects[goIndex].enteringCutscene();
  });

  for (let i = 0; i < cutscene.events.length; i++) {
    console.log("in event loop: ", cutscene.events[i]);
    const eventConfig = cutscene.events[i];
    const eventHandler = new myEvent(eventConfig);
    const result = await eventHandler.init();
  }

  cutscene.who.forEach((cs: any) => {
    //i need to set the cutscene flag for each object
    const goIndex = gameObjects.findIndex((go: any) => {
      return go.id == cs;
    });
    gameObjects[goIndex].exitingCutscene();
  });
};

bt1.addEventListener("click", () => startCutscene(cutscenes["opening"]));
bt2.addEventListener("click", () => {
  console.log("index 0", gameObjects[0]);
  console.log("index 1", gameObjects[1]);
});
bt3.addEventListener("click", () => console.log("starting cutscene 3"));

class person {
  id: string;
  isCutscenePlaying: boolean = false;
  position: { x: 0; y: 0 };
  behaviorLoop?: any[] = [];
  behaviorIndex: 0;
  cutscenes: {};
  constructor(name: string) {
    this.id = name;
  }
  update() {}
  enteringCutscene() {
    console.log("stopping behavior loop");
    this.isCutscenePlaying = true;
  }
  exitingCutscene() {
    console.log("starting behavior loop");
    this.isCutscenePlaying = false;
    this.startBehaviorLoop();
  }
  async startBehaviorLoop() {}
}

class chef extends person {
  constructor() {
    super("chef");
    this.behaviorLoop = [
      { type: "stand", id: "chef", direction: "left", duration: 500 },
      { type: "stand", id: "chef", direction: "up", duration: 500 },
      { type: "stand", id: "chef", direction: "right", duration: 500 },
      { type: "stand", id: "chef", direction: "down", duration: 500 },
    ];
    this.behaviorIndex = 0;
    setTimeout(() => {
      this.startBehaviorLoop();
    }, 25);
  }

  update() {}

  async startBehaviorLoop() {
    if (this.isCutscenePlaying) return;
    let eventConfig = this.behaviorLoop[this.behaviorIndex];
    const eventHandler = new myEvent(eventConfig);
    await eventHandler.init();
    this.behaviorIndex += 1;
    if (this.behaviorIndex === this.behaviorLoop.length) {
      this.behaviorIndex = 0;
    }
    this.startBehaviorLoop();
  }
}

class player extends person {
  constructor() {
    super("p1");
  }
}

const gameObjects = <any>[];
gameObjects.push(new player());
gameObjects.push(new chef());

console.log("index 0", gameObjects[0].id);
console.log("index 1", gameObjects[1].id);

const cutscenes = {
  opening: {
    who: ["chef", "p1"],
    events: [
      { type: "walk", id: "chef", direction: "down", distance: 500 },
      { type: "walk", id: "p1", direction: "up", distance: 500 },
    ],
  },
  talking: {
    who: ["chef", "p1"],
    events: [
      { type: "textMessage", id: "chef", message: "Hey What's up" },
      { type: "textMessage", id: "p1", message: "Notin' much" },
    ],
  },
  maptrigger: {
    who: ["p1"],
    events: [{ type: "textMessage", id: "p1", message: "Stubbed my toe!" }],
  },
};

type Eventconfig = {
  id: string;
  type: "walk" | "stand" | "textMessage";
  direction?: string;
  distance?: number;
  duration?: number;
  message?: string;
};

class myEvent {
  event: Eventconfig;
  constructor(event: Eventconfig) {
    this.event = event;
  }

  walk = (resolve: any) => {
    console.log(`EVENT: Walk, WHO: ${this.event.id}, Direction: ${this.event.direction}, Distance: ${this.event.distance}`);
    return resolve();
  };

  stand = (resolve: any) => {
    console.log(`EVENT: Stand, WHO: ${this.event.id}, Direction: ${this.event.direction}, Duration: ${this.event.duration}`);
    setTimeout(() => {
      return resolve();
    }, this.event.duration);
  };

  textMessage = (resolve: any) => {
    console.log(`EVENT: Text, WHO: ${this.event.id}, Message: ${this.event.message}`);
    return resolve();
  };

  init() {
    return new Promise(resolve => {
      this[this.event.type](resolve);
    });
  }
}
