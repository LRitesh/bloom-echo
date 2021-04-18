// Bloom Echo v1

let synth, soundLoop;
let notePattern = [];
let notePatternIndex;

let noteTable = [48, 50, 52, 53, 55, 57, 59, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81];
let noteCircles = [];
let noteHues = [];
let bgColors = ['#262A4D', '#264C4D', '#262A4D', '#264D34', '#4D2639', '#46264D', '#264D3F', '#35264D'];  // first load bg color options

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

let delayTime = 0;
let feedback = 0;
let noteSize = windowHeight / (noteTable.length * 2.0);
let speedMode = 2;

let slowButton, medButton, fastButton;
let autoButton, clearButton, clickButton;
let fillNoteButton, drawLinesButton, randomColorsButton;

let fillNotes = false;
let drawLines = true;
let randomColors = false;
let autoMode = false;
let autoTriggerFrame = 0;
let autoTriggerWait = 5;
let buttonMargin = 15;

class noteCircle {
  constructor(radius) {
    this.radius = radius;
    this.enabled = false;
  }
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.mousePressed(addNoteFromMouse);
  colorMode(HSB);

  synth = new p5.MonoSynth();
  soundLoop = new p5.SoundLoop(onSoundLoop, 0.5);
  delay = new p5.Delay();

  smooth();

  slowButton = createButton('slow');
  slowButton.position(buttonMargin, buttonMargin);
  slowButton.mousePressed(selectSlow);

  medButton = createButton('medium');
  medButton.position(buttonMargin, slowButton.elt.offsetTop + slowButton.elt.offsetHeight + buttonMargin);
  medButton.mousePressed(selectMedium);

  fastButton = createButton('fast');
  fastButton.position(buttonMargin, medButton.elt.offsetTop + medButton.elt.offsetHeight + buttonMargin);
  fastButton.mousePressed(selectFast);

  autoButton = createButton('auto');
  autoButton.position(windowWidth - (buttonMargin * 2) - autoButton.elt.offsetWidth, buttonMargin);
  autoButton.mousePressed(toggleAutoMode);

  clearButton = createButton('clear');
  clearButton.position(windowWidth - (buttonMargin * 2) - clearButton.elt.offsetWidth, autoButton.elt.offsetHeight + autoButton.elt.offsetTop + buttonMargin);
  clearButton.mousePressed(clearNotes);

  clickButton = createButton('clicky ->');
  clickButton.position(windowWidth / 2.0 - clickButton.elt.offsetWidth - buttonMargin * 3, windowHeight - random(noteSize * 6.0, windowHeight / 2.0 - noteSize * 4.0));
  clickButton.mousePressed(clearNotes);
  clickButton.elt.classList.add('floating');

  randomColorsButton = createButton('random');
  randomColorsButton.position(buttonMargin, windowHeight - randomColorsButton.elt.offsetHeight - buttonMargin * 2);
  randomColorsButton.mousePressed(onRandomColorsButtonClick);

  drawLinesButton = createButton('line');
  drawLinesButton.position(buttonMargin, randomColorsButton.elt.offsetTop - buttonMargin - drawLinesButton.elt.offsetHeight);
  drawLinesButton.mousePressed(onLineToggleClick);
  drawLinesButton.elt.classList.add('selected');

  fillNoteButton = createButton('fill');
  fillNoteButton.position(buttonMargin, drawLinesButton.elt.offsetTop - buttonMargin - fillNoteButton.elt.offsetHeight);
  fillNoteButton.mousePressed(onfillNoteButtonClick);

  let randomBgColor = floor(random(bgColors.length));
  background(color(bgColors[randomBgColor]));

  // draw notes
  rectMode(CENTER);
  for (let i = 0; i < noteTable.length; i++) {

    let radius = noteSize * i;
    let nc = new noteCircle(radius);
    noteCircles.push(nc);
    let mappedHue = map(noteTable[i], noteTable[0], noteTable[noteTable.length - 1], 0, 260);
    noteHues.push(mappedHue);

    drawNote(i);
  }

  selectMedium();
}

function addNoteFromMouse() {
  clickButton.elt.style.display = 'none';
  addNote(mouseY);
}

function addNote(noteMapValue) {
  userStartAudio();

  if (!soundLoop.isPlaying) {
    soundLoop.start();
  }

  if (notePattern.length < 4) {
    delayTime = 0.5;
    feedback = 0.75;
  } else {
    delayTime = random(0.3, 0.7);
    feedback = random(0.5, 0.7);
  }

  delay.process(synth, delayTime, feedback, 2300);

  let indexInTable = floor(map(abs(windowHeight / 2.0 - noteMapValue - noteSize / 2.0), 0, windowHeight / 2.0, 0, noteTable.length));
  let midi = noteTable[indexInTable];

  if (notePattern.indexOf(midi) != -1) {
    return;
  }

  // enable this node
  noteCircles[indexInTable].enabled = true;

  if (notePattern.length > 5) {
    // remove old note
    let removedNote = notePattern.splice(notePatternIndex, 1, midi)[0];
    let removedNoteIndex = noteTable.indexOf(removedNote);
    noteCircles[removedNoteIndex].enabled = false;
  } else {
    notePattern.splice(notePatternIndex, 0, midi);
  }
}

// loop through notes
function onSoundLoop(timeFromNow) {
  notePatternIndex = (soundLoop.iterations - 1) % notePattern.length;
  let midi = notePattern[notePatternIndex];
  let note = midiToFreq(midi);
  synth.play(note, 0.25, timeFromNow * 5 / notePattern.length);
  let indexInTable = noteTable.indexOf(midi);

  drawNote(indexInTable);
}

function drawNote(index) {

  let noteColor;

  let x, y;
  let noteEnabled = noteCircles[index].enabled;
  let radius = noteCircles[index].radius;

  if (noteEnabled) {
    x = windowWidth / 2.0 - radius * sin(soundLoop.iterations / 15.0);
    y = windowHeight / 2.0 + radius * cos(soundLoop.iterations / 15.0);

  } else {
    x = windowWidth / 2.0;
    y = windowHeight / 2.0 + index * noteSize;
  }

  strokeWeight(2);

  if (!randomColors) {
    noteColor = color(noteHues[index] + random(-10, 10), 70, 75);
  } else {
    noteColor = color(random(360), 70, 75);
  }

  if (fillNotes) {
    fill(noteColor);
  } else {
    noFill();
  }

  stroke(noteColor);
  rect(x, y, noteSize * 4 / 5 + random(feedback * 10), noteSize * 4 / 5 + random(delayTime * 10), random(5, 30), random(5, 30), random(5, 30), random(5, 30));

  if (noteEnabled && drawLines) {
    strokeWeight(1);
    line(x, y, windowWidth / 2.0, windowHeight / 2.0);
  }
}

function draw() {
  if (!autoMode) {
    return;
  }

  if (frameCount - autoTriggerFrame > autoTriggerWait * 60) {
    addNote(random(0, windowHeight / 2.0));
    autoTriggerFrame = frameCount;
  }
}

function keyPressed() {
  switch (keyCode) {
    // 'c'
    case 67:
      clearNotes();
      break;
  }

}

function clearNotes() {
  if (autoMode) {
    toggleAutoMode();
  }

  soundLoop.stop();
  notePattern = [];
  background(random(0, 360), 50, 30);
  feedback = 0;
  delayTime = 0;

  clickButton.elt.style.display = 'block';
  clickButton.position(windowWidth / 2.0 - clickButton.elt.offsetWidth - buttonMargin * 3, windowHeight - random(noteSize * 6.0, windowHeight / 2.0 - noteSize * 4.0));

  for (let i = 0; i < noteTable.length; i++) {
    noteCircles[i].enabled = false;
    drawNote(i);
  }
}

function selectSlow() {
  speedMode = 1;
  soundLoop.interval = 0.5;
  slowButton.elt.classList.add('selected');
  medButton.elt.classList.remove('selected');
  fastButton.elt.classList.remove('selected');
}

function selectMedium() {
  speedMode = 2;
  soundLoop.interval = 0.25;
  slowButton.elt.classList.remove('selected');
  medButton.elt.classList.add('selected');
  fastButton.elt.classList.remove('selected');
}

function selectFast() {
  speedMode = 3;
  soundLoop.interval = 0.1;
  slowButton.elt.classList.remove('selected');
  medButton.elt.classList.remove('selected');
  fastButton.elt.classList.add('selected');
}

function onRandomColorsButtonClick() {
  randomColors = !randomColors;
  randomColorsButton.elt.classList.toggle('selected');
}

function onLineToggleClick() {
  drawLines = !drawLines;
  drawLinesButton.elt.classList.toggle('selected');
}

function onfillNoteButtonClick() {
  fillNotes = !fillNotes;
  fillNoteButton.elt.classList.toggle('selected');
}

function toggleAutoMode() {
  autoMode = !autoMode;

  // less chance of high freq
  if (random() < 0.8) {
    addNote(random(windowHeight / 2.0 - noteSize * 5, windowHeight / 2.0));
  } else {
    addNote(random(0, windowHeight / 2.0 - noteSize * 5));
  }

  autoButton.elt.classList.toggle('selected');
  autoTriggerFrame = frameCount;

  if (autoMode) {
    clickButton.elt.style.display = 'none';
  }
}

function windowResized() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  resizeCanvas(windowWidth, windowHeight);

  slowButton.position(buttonMargin, buttonMargin);
  medButton.position(buttonMargin, slowButton.elt.offsetTop + slowButton.elt.offsetHeight + buttonMargin);
  fastButton.position(buttonMargin, medButton.elt.offsetTop + medButton.elt.offsetHeight + buttonMargin);
  autoButton.position(windowWidth - (buttonMargin * 2) - autoButton.elt.offsetWidth, buttonMargin);
  clearButton.position(windowWidth - (buttonMargin * 2) - clearButton.elt.offsetWidth, autoButton.elt.offsetHeight + autoButton.elt.offsetTop + buttonMargin);
  clickButton.position(windowWidth / 2.0 - clickButton.elt.offsetWidth - buttonMargin * 3, windowHeight - random(noteSize * 6.0, windowHeight / 2.0 - noteSize * 4.0));
  randomColorsButton.position(buttonMargin, windowHeight - randomColorsButton.elt.offsetHeight - buttonMargin * 2);
  drawLinesButton.position(buttonMargin, randomColorsButton.elt.offsetTop - buttonMargin - drawLinesButton.elt.offsetHeight);
  fillNoteButton.position(buttonMargin, drawLinesButton.elt.offsetTop - buttonMargin - fillNoteButton.elt.offsetHeight);

  let randomBgColor = floor(random(bgColors.length));
  background(color(bgColors[randomBgColor]));

  // draw notes
  for (let i = 0; i < noteTable.length; i++) {
    drawNote(i);
  }
}