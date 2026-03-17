let data;
let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

let stations = {};
let tubeColors = {};
let showStationNames = false;
let lineStates = {};

let lineTurbulence = {};

const PANEL_WIDTH = 280;

// UI controls
let ui = {
  startX: 30,
  startY: 30,
  spacingY: 40,
  buttonWidth: 200,
  buttonHeight: 26,
  padding: 10
};

async function setup() {

  createCanvas(1800, 1000);
  textFont("monospace");
  textSize(10);
  textAlign(CENTER, CENTER);

 

  data = await loadTable("all_data_combined.csv", ",", "header");

  tubeColors = {
    "Bakerloo": color(178, 99, 0, 200),
    "Central": color(220, 36, 31, 200),
    "Circle": color(255, 211, 41, 200),
    "Northern": color(0, 0, 0, 200),
    "Victoria": color(0, 152, 216, 200),
    "Elizabeth": color(119, 61, 189, 200)
  };

  // init toggle states
  for (let line in tubeColors) {
    lineStates[line] = true;
  }

  // parse data
  for (let i = 0; i < data.getRowCount(); i++) {

    let station = data.getString(i, "Station");
    let line = data.getString(i, "Tube Line");
    let turbulence = data.getNum(i, "Turbulence");
    let lon = data.getNum(i, "X");
    let lat = data.getNum(i, "Y");

    if (!stations[station]) {
      stations[station] = {
        lines: [line],
        turbulence: [turbulence],
        x: lon,
        y: lat,
        offsets: [{x:0,y:0}],
        highlight:200
      };
    } else {
      stations[station].lines.push(line);
      stations[station].turbulence.push(turbulence);
      stations[station].offsets.push({x:0,y:0});
    }

    minLon = min(minLon, lon);
    maxLon = max(maxLon, lon);
    minLat = min(minLat, lat);
    maxLat = max(maxLat, lat);
  }

  calculateLineTurbulence();
}

function draw() {

  background(240);

  let hoveredStation = null;
  let hoveredX, hoveredY;

  let mapRightEdge = width - PANEL_WIDTH - 200;
  let mapLeft = 350;
  let mapTop = 150;
  let mapBottom = height - 250;

  // detect hover
  for (let stationName in stations) {

    let station = stations[stationName];

    let x = map(station.x, minLon, maxLon, mapLeft, mapRightEdge);
    let y = map(station.y, minLat, maxLat, mapBottom, mapTop);

    let maxTurbulence = max(station.turbulence);
    let size = map(maxTurbulence, 0, 25, 8, 30);

    if (dist(mouseX, mouseY, x, y) < size/2) {
      hoveredStation = station;
      hoveredStation.name = stationName;
      hoveredX = x;
      hoveredY = y;
    }
  }

  // draw stations
  for (let stationName in stations) {

    let station = stations[stationName];

    let x = map(station.x, minLon, maxLon, mapLeft, mapRightEdge);
    let y = map(station.y, minLat, maxLat, mapBottom, mapTop);

    let maxTurbulence = max(station.turbulence);
    let size = map(maxTurbulence, 0, 25, 8, 30);

    let hovered = hoveredStation === station;

    let targetAlpha = 200;
    if (hoveredStation) {
      targetAlpha = hovered ? 255 : 60;
    }

    station.highlight = lerp(station.highlight, targetAlpha, 0.15);

    for (let i = 0; i < station.lines.length; i++) {

      let line = station.lines[i];
      if (!lineStates[line]) continue;

      let c = tubeColors[line];

      let targetX = 0;
      let targetY = 0;

      if (hovered && station.lines.length > 1) {
        let angle = TWO_PI * i / station.lines.length;
        let spreadRadius = 20;
        targetX = cos(angle) * spreadRadius;
        targetY = sin(angle) * spreadRadius;
      }

      station.offsets[i].x = lerp(station.offsets[i].x, targetX, 0.1);
      station.offsets[i].y = lerp(station.offsets[i].y, targetY, 0.1);

      let drawX = x + station.offsets[i].x;
      let drawY = y + station.offsets[i].y;

      noStroke();
      fill(red(c), green(c), blue(c), station.highlight);
      ellipse(drawX, drawY, size * 1.5 + i * 10);
    }

    if (showStationNames) {
      fill(0);
      text(stationName, x - 25, y + 25);
    }
  }

  if (hoveredStation) {
    drawTooltip(hoveredX, hoveredY, hoveredStation);
  }

  drawTurbulencePanel();
  drawUI();
}

function drawUI() {

  let x = ui.startX;
  let y = ui.startY;

  textAlign(LEFT, CENTER);
  textSize(12);

  // station toggle
  drawButton(
    x, y,
    ui.buttonWidth,
    ui.buttonHeight,
    showStationNames ? color(50,180,120) : color(200),
    showStationNames ? "Hide Station Names" : "Show Station Names"
  );

  y += ui.spacingY;

  // line toggles
  for (let line in tubeColors) {

    let active = lineStates[line];
    let c = tubeColors[line];

    let buttonColor = active
      ? c
      : color(red(c), green(c), blue(c), 60);

    drawButton(
      x, y,
      ui.buttonWidth,
      ui.buttonHeight,
      buttonColor,
      line
    );

    y += ui.spacingY;
  }
}

function drawButton(x, y, w, h, bgColor, label) {

  let hovering =
    mouseX > x && mouseX < x + w &&
    mouseY > y && mouseY < y + h;

  noStroke();
  fill(hovering ? lerpColor(bgColor, color(255), 0.2) : bgColor);
  rect(x, y, w, h, 6);

  fill(0);
  text(label, x + ui.padding, y + h / 2);
}

function mousePressed() {

  let x = ui.startX;
  let y = ui.startY;

  // station toggle
  if (overButton(x, y, ui.buttonWidth, ui.buttonHeight)) {
    showStationNames = !showStationNames;
    return;
  }

  y += ui.spacingY;

  // line toggles
  for (let line in tubeColors) {

    if (overButton(x, y, ui.buttonWidth, ui.buttonHeight)) {
      lineStates[line] = !lineStates[line];
      return;
    }

    y += ui.spacingY;
  }
}

function overButton(x, y, w, h) {
  return (
    mouseX > x &&
    mouseX < x + w &&
    mouseY > y &&
    mouseY < y + h
  );
}

function calculateLineTurbulence() {

  lineTurbulence = {};

  for (let line in tubeColors) {

    let values = [];

    for (let stationName in stations) {

      let station = stations[stationName];

      for (let i = 0; i < station.lines.length; i++) {
        if (station.lines[i] === line) {
          values.push(station.turbulence[i]);
        }
      }
    }

    lineTurbulence[line] =
      values.length ? values.reduce((a,b)=>a+b)/values.length : 0;
  }
}

function drawTurbulencePanel() {

  push();

  let panelX = width - PANEL_WIDTH - 1500;
  let panelY = 700;
  let panelWidth = PANEL_WIDTH - 60;
  let spacing = 50;

  fill(0);
  textAlign(LEFT,CENTER);
  text("Average Turbulence per Line", panelX, panelY-30);

  let maxTurb = max(Object.values(lineTurbulence));

  let i = 0;

  for (let line in tubeColors) {

    let avgTurb = lineTurbulence[line];
    let barLength = map(avgTurb,0,maxTurb,0,panelWidth);

    fill(tubeColors[line]);
    rect(panelX, panelY + i*spacing, barLength, 10,4);

    fill(0);
    text(`${line} (${avgTurb.toFixed(1)})`,
         panelX + barLength + 10,
         panelY + i*spacing);

    i++;
  }

  pop();
}

function drawTooltip(x,y,station) {

  let padding = 10;

  let linesText = station.lines.join(", ");
  let turbulenceText = station.turbulence.join(", ");

  let textW = max(
    textWidth(station.name),
    textWidth(`Lines: ${linesText}`),
    textWidth(`Turbulence: ${turbulenceText}`)
  );

  let w = textW + padding*5;
  let h = 60;

  let boxX = width/2;
  let boxY = 60;

  push();

  rectMode(CENTER);

  fill(255);
  noStroke();
  rect(boxX, boxY, w, h, 6);

  fill(0);
  textAlign(LEFT,TOP);

  text(station.name, boxX - w/2 + padding, boxY - h/2 + 5);
  text(`Lines: ${linesText}`, boxX - w/2 + padding, boxY - h/2 + 20);
  text(`Turbulence: ${turbulenceText}`, boxX - w/2 + padding, boxY - h/2 + 35);

  pop();
}