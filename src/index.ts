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
  const em = cutscenes[cutscene].eventMgr;

  if (who.length == 0) return;
  who.forEach((whom: string) => {
    const goIndex = gameObjects.findIndex((go: any) => go.id == whom);
    gameObjects[goIndex].startCutscene(cutscene, em);
  });
};

bt1.addEventListener("click", () => startCutscene("opening"));
bt2.addEventListener("click", () => startCutscene("talking"));
bt3.addEventListener("click", () => startCutscene("maptrigger"));

class EventManager {
  who: any[] = [];
  sequence: number = 0;

  constructor(who: any[]) {
    who.forEach((who, i) => {
      this.who[i] = { object: who, sequence: 0, reset: false };
    });
  }

  reset = (who: string) => {
    const whoIndex = this.who.findIndex(w => w.object == who);
    this.who[whoIndex].reset = true;

    if (this.who.every(w => w.reset == true)) {
      this.who.forEach(w => {
        w.sequence = 0;
        w.reset = false;
      });
      this.sequence = 0;
      console.log(this.who[0], this.who[1]);
    }
  };

  increment = (who: string) => {
    const whoIndex = this.who.findIndex(w => w.object == who);
    this.who[whoIndex].sequence += 1;
    this.checkEMsequence();
  };

  checkEMsequence() {
    console.log(this.who[0], this.who[1]);
    const test = this.who.every(w => w.sequence > this.sequence);
    if (test) this.sequence += 1;
  }

  getSequenceIndex = (): number => {
    return this.sequence;
  };
}

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
          { type: "walk", id: "chef", direction: "down", distance: 500, sequence: 0 },
          { type: "walk", id: "chef", direction: "left", distance: 200, sequence: 1 },
          { type: "wait", id: "chef", sequence: 2 },
          { type: "reset", id: "chef", sequence: 3 },
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

  startCutscene = async (cutscene: string, em: EventManager | undefined) => {
    this.isCutscenePlaying = true;

    const events = this.cutscene[cutscene].events;
    for (let i = 0; i < events.length; i++) {
      const eventConfig = events[i];
      if (em) eventConfig["em"] = em;
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
          { type: "walk", id: "p1", direction: "up", distance: 100, sequence: 0 },
          { type: "stand", id: "p1", direction: "down", duration: 1000, sequence: 1 },
          { type: "walk", id: "p1", direction: "right", distance: 300, sequence: 2 },
          { type: "reset", id: "p1", sequence: 3 },
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

  async startCutscene(cutscene: string, em: EventManager | undefined) {
    this.isCutscenePlaying = true;
    const events = this.cutscene[cutscene].events;
    for (let i = 0; i < events.length; i++) {
      const eventConfig = events[i];
      if (em) eventConfig["em"] = em;
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
    eventMgr: new EventManager(["chef", "p1"]),
  },
  talking: {
    who: ["chef", "p1"],
    eventMgr: <any>undefined,
  },
  maptrigger: {
    who: ["p1"],
    eventMgr: <any>undefined,
  },
};

type Eventconfig = {
  id: string;
  type: "walk" | "stand" | "textMessage" | "wait" | "reset";
  direction?: string;
  distance?: number;
  duration?: number;
  message?: string;
  sequence?: number;
  em?: EventManager;
};

class myEvent {
  event: Eventconfig;
  constructor(event: Eventconfig) {
    this.event = event;
  }

  walk = (resolve: any) => {
    if (this.event.em) {
      const sequence = this.event.sequence;
      const currentStep = this.event.em.getSequenceIndex();

      if (currentStep < sequence) {
        setTimeout(() => {
          this.walk(resolve);
        }, 250);
        return;
      }
    }
    console.log(`EVENT: Walk, WHO: ${this.event.id}, Direction: ${this.event.direction}, Distance: ${this.event.distance}`);
    const whostring = this.event.id;
    const whoIndex = gameObjects.findIndex((who: any) => who.id == whostring);
    gameObjects[whoIndex].startBehavior({ type: "walk", direction: this.event.direction, distance: this.event.distance });

    const completeHandler = (e: any) => {
      if (e.detail.who === gameObjects[whoIndex].id) {
        document.removeEventListener(`PersonWalkingComplete_${this.event.id}`, completeHandler);
        if (this.event.em) this.event.em.increment(this.event.id);
        resolve();
      }
    };
    document.addEventListener(`PersonWalkingComplete_${this.event.id}`, completeHandler);
  };

  wait = (resolve: any) => {
    if (this.event.em) {
      const sequence = this.event.sequence;
      const currentStep = this.event.em.getSequenceIndex();

      if (currentStep < sequence) {
        setTimeout(() => {
          this.wait(resolve);
        }, 10);
        return;
      }
    }
    console.log(`EVENT: wait sequence, WHO: ${this.event.id}`);
    if (this.event.em) this.event.em.increment(this.event.id);
    resolve();
  };

  reset = (resolve: any) => {
    if (this.event.em) {
      const sequence = this.event.sequence;
      const currentStep = this.event.em.getSequenceIndex();

      if (currentStep < sequence) {
        setTimeout(() => {
          this.reset(resolve);
        }, 250);
        return;
      }
    }
    console.log(`EVENT: reset, WHO: ${this.event.id}`);
    if (this.event.em) this.event.em.reset(this.event.id);
    resolve();
  };

  stand = (resolve: any) => {
    if (this.event.em) {
      const sequence = this.event.sequence;
      const currentStep = this.event.em.getSequenceIndex();
      if (currentStep < sequence) {
        setTimeout(() => {
          this.stand(resolve);
        }, 250);
        return;
      }
    }
    console.log(`EVENT: Stand, WHO: ${this.event.id}, Direction: ${this.event.direction}, Duration: ${this.event.duration}`);
    const whostring = this.event.id;
    const whoIndex = gameObjects.findIndex((who: any) => who.id == whostring);
    gameObjects[whoIndex].startBehavior({ type: "stand", direction: this.event.direction, duration: this.event.duration });

    const completeHandler = (e: any) => {
      if (e.detail.who === gameObjects[whoIndex].id) {
        document.removeEventListener(`PersonStandComplete_${this.event.id}`, completeHandler);
        if (this.event.em) this.event.em.increment(this.event.id);
        resolve();
      }
    };
    document.addEventListener(`PersonStandComplete_${this.event.id}`, completeHandler);
  };

  textMessage = (resolve: any) => {
    if (this.event.em) {
      const sequence = this.event.sequence;
      const currentStep = this.event.em.getSequenceIndex();
      if (currentStep < sequence) {
        setTimeout(() => {
          this.textMessage(resolve);
        }, 250);
        return;
      }
    }
    console.log(`EVENT: Text, WHO: ${this.event.id}, Message: ${this.event.message}`);
    window.alert(`${this.event.id}: ${this.event.message}`);
    if (this.event.em) this.event.em.increment(this.event.id);
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
