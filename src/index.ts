import "./style.css";

const bt1 = document.getElementById("ct1");
const bt2 = document.getElementById("ct2");
const bt3 = document.getElementById("ct3");
const chefX = document.getElementById("chefX");
const chefY = document.getElementById("chefY");
const p1X = document.getElementById("player1X");
const p1Y = document.getElementById("player1Y");

const startCutscene = async (cutscene: "opening" | "talking" | "maptrigger") => {
  const who = cutscenes[cutscene].who;
  if (who.length == 0) return;
  who.forEach((whom: string) => {
    const goIndex = gameObjects.findIndex((go: any) => go.id == whom);
    gameObjects[goIndex].startCutscene(cutscene);
  });
};

bt1.addEventListener("click", () => startCutscene("opening"));
bt2.addEventListener("click", () => startCutscene("talking"));
bt3.addEventListener("click", () => startCutscene("maptrigger"));

class person {
  direction: string = "down";
  id: string;
  isCutscenePlaying: boolean = false;
  position: any = { x: 0, y: 0 };
  behaviorLoop?: any[] = [];
  behaviorIndex: 0;
  pixelsRemainingToMove: number = 0;
  cutscenes: {};
  constructor(name: string) {
    this.id = name;
  }

  setHTML = (x: number, y: number) => {};

  update() {
    if (this.pixelsRemainingToMove > 0) {
      switch (this.direction) {
        case "down":
          this.position.y += 1;
          break;
        case "up":
          this.position.y -= 1;
          break;
        case "left":
          this.position.x -= 1;
          break;
        case "right":
          this.position.x += 1;
          break;
      }
      this.setHTML(this.position.x, this.position.y);
      this.pixelsRemainingToMove -= 1;
    } else {
      const myEvent = new CustomEvent(`PersonWalkingComplete_${this.id}`, { detail: { who: this.id } });
      document.dispatchEvent(myEvent);
    }
  }

  startBehavior(event: any) {
    this.direction = event.direction;
    if (event.type === "walk") {
      this.pixelsRemainingToMove = event.distance;
      return;
    } else if (event.type == "stand") {
      setTimeout(() => {
        const myEvent = new CustomEvent(`PersonStandComplete_${this.id}`, { detail: { who: this.id } });
        document.dispatchEvent(myEvent);
      }, event.duration);
    }
  }

  async startBehaviorLoop() {}
}

class chef extends person {
  cutscene: any;
  constructor() {
    super("chef");
    this.position.x = 200;
    this.position.y = 200;
    this.setHTML(this.position.x, this.position.y);
    this.cutscene = {
      opening: {
        events: [
          { type: "walk", id: "chef", direction: "down", distance: 500 },
          { type: "walk", id: "chef", direction: "left", distance: 200 },
        ],
      },
      talking: {
        events: [{ type: "textMessage", id: "chef", message: "Hey What's up" }],
      },
    };
    this.behaviorLoop = [
      { type: "stand", id: "chef", direction: "left", duration: 1000 },
      { type: "stand", id: "chef", direction: "up", duration: 1000 },
      { type: "stand", id: "chef", direction: "right", duration: 1000 },
      { type: "stand", id: "chef", direction: "down", duration: 1000 },
    ];
    this.behaviorIndex = 0;
    setTimeout(() => {
      this.startBehaviorLoop();
    }, 25);
  }

  setHTML = (x: number, y: number) => {
    chefX.innerHTML = `${x}`;
    chefY.innerHTML = `${y}`;
  };

  startCutscene = async (cutscene: string) => {
    this.isCutscenePlaying = true;
    console.log(cutscene);

    const events = this.cutscene[cutscene].events;
    for (let i = 0; i < events.length; i++) {
      const eventConfig = events[i];
      const eventHandler = new myEvent(eventConfig);
      const result = await eventHandler.init();
    }
    this.isCutscenePlaying = false;
    this.startBehaviorLoop();
  };

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
  cutscene: any;

  constructor() {
    super("p1");
    this.position.x = 100;
    this.position.y = 100;
    this.setHTML(this.position.x, this.position.y);
    this.cutscene = {
      opening: {
        events: [
          { type: "walk", id: "p1", direction: "up", distance: 100 },
          { type: "walk", id: "p1", direction: "right", distance: 300 },
        ],
      },
      talking: {
        events: [{ type: "textMessage", id: "p1", message: "Not much" }],
      },
      maptrigger: {
        events: [{ type: "textMessage", id: "p1", message: "Stubbed my toe!" }],
      },
    };
  }

  setHTML = (x: number, y: number) => {
    p1X.innerHTML = `${x}`;
    p1Y.innerHTML = `${y}`;
  };

  async startCutscene(cutscene: string) {
    this.isCutscenePlaying = true;
    const events = this.cutscene[cutscene].events;
    for (let i = 0; i < events.length; i++) {
      const eventConfig = events[i];
      const eventHandler = new myEvent(eventConfig);
      const result = await eventHandler.init();
    }
    this.isCutscenePlaying = false;
  }
}

const gameObjects = <any>[];
gameObjects.push(new player());
gameObjects.push(new chef());

const cutscenes = {
  opening: {
    who: ["chef", "p1"],
  },
  talking: {
    who: ["chef", "p1"],
  },
  maptrigger: {
    who: ["p1"],
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
    const whostring = this.event.id;
    const whoIndex = gameObjects.findIndex((who: any) => who.id == whostring);
    gameObjects[whoIndex].startBehavior({ type: "walk", direction: this.event.direction, distance: this.event.distance });

    const completeHandler = (e: any) => {
      if (e.detail.who === gameObjects[whoIndex].id) {
        console.log("closing listener");
        document.removeEventListener(`PersonWalkingComplete_${this.event.id}`, completeHandler);
        resolve();
      }
    };
    document.addEventListener(`PersonWalkingComplete_${this.event.id}`, completeHandler);
  };

  stand = (resolve: any) => {
    console.log(`EVENT: Stand, WHO: ${this.event.id}, Direction: ${this.event.direction}, Duration: ${this.event.duration}`);
    const whostring = this.event.id;
    const whoIndex = gameObjects.findIndex((who: any) => who.id == whostring);
    gameObjects[whoIndex].startBehavior({ type: "stand", direction: this.event.direction, duration: this.event.duration });

    const completeHandler = (e: any) => {
      if (e.detail.who === gameObjects[whoIndex].id) {
        document.removeEventListener(`PersonStandComplete_${this.event.id}`, completeHandler);
        resolve();
      }
    };
    document.addEventListener(`PersonStandComplete_${this.event.id}`, completeHandler);
  };

  textMessage = (resolve: any) => {
    console.log(`EVENT: Text, WHO: ${this.event.id}, Message: ${this.event.message}`);
    window.alert(`${this.event.id}: ${this.event.message}`);
    return resolve();
  };

  init() {
    return new Promise(resolve => {
      this[this.event.type](resolve);
    });
  }
}

const gameLoop = (timestamp: number) => {
  gameObjects.forEach((g: any) => g.update());
  requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);
