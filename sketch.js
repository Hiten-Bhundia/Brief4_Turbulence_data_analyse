// this should be on git

let turbulenceData;
let positionData;

async function setup() {
  createCanvas(1200, 700);
  textFont("monospace");
  textSize(12);
  textAlign(CENTER);
  background(240);
  noLoop(); // draw once

  // Load CSV files
  turbulenceData = await loadTable("tube_turbulence_dataset.csv", ",", "header");
  positionData = await loadTable("station_positions.csv", ",", "header");

  console.log("Turbulence CSV loaded:", turbulenceData.getRowCount(), "rows");
  console.log("Position CSV loaded:", positionData.getRowCount(), "rows");
}

function draw() {
  background(240);

  if (turbulenceData && positionData) {

    let numRows = turbulenceData.getRowCount();

    for (let i = 0; i < numRows; i++) {

      let stationName = turbulenceData.getString(i, "Station");
      let line = turbulenceData.getString(i, "Tube Line");
      let turbulence = turbulenceData.getNum(i, "Turbulence");

      // Find corresponding position
      let x = 0;
      let y = 0;
      let found = false;

      for (let j = 0; j < positionData.getRowCount(); j++) {
        if (positionData.getString(j, "Station") === stationName) {
          x = positionData.getNum(j, "x");
          y = positionData.getNum(j, "y");
          found = true;
          break;
        }
      }

      if (!found) {
        console.warn("Position not found for station:", stationName);
        continue;
      }

      // Draw station
      let size = map(turbulence, 0, 0.4, 8, 30);
      fill(0);
      noStroke();
      ellipse(x, y, size);

      // Draw turbulence value
      fill(0);
      text(turbulence.toFixed(3), x, y - 10);
    }
  }
}