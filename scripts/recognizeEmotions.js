document.getElementById("startRecordingbtn").onclick = function () {
  startRecording();
};

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const expressions = {};
const expressionsPercentage = {};
let isRecording = false;
let iterationCount = 0;

emptyTable();

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(startVideo);

const drawFaceLandmarkOptions = {
  lineColor: "rgba(255,255,255,1)",
  pointColor: "rgba(0,0,0,1)",
  lineWidth: 5,
};

const useTinyModel = true;

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", () => {
  document.body.append(canvas);
  // Change display size of drawing
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    console.log(detections)

    // Start recording only if its called
    if (isRecording) {
      console.log(detections[0].expressions);
      Object.keys(detections[0].expressions).map((expression) => {
        if (!expressions[expression]) {
          expressions[expression] = 0;
        }
        if (detections[0].expressions[expression]) {
          expressions[expression] += detections[0].expressions[expression];
        }
      });
      console.log("current expression value");
      console.log(expressions);
      iterationCount++;
      console.log(iterationCount);
      // Update table after 1 second
      if (iterationCount % 10 == 0) {
        createTable();
        for (var member in expressions) delete expressions[member];
      }

      // End recording after 10 seconds
      if (iterationCount == 100) {
        isRecording = false;
        iterationCount = 0;
        console.log("Recording stopped");
        document.getElementById("recordingStatus").innerHTML =
          "Recording is currently off.";
        document.getElementById("recordingStatus").style.color = "red";
        document.getElementById("startRecordingbtn").disabled = false;
        document.getElementById("startRecordingbtn").style.opacity = 1;
        document.getElementById("startRecordingbtn").style.cursor = "pointer";
        // Create table after full recording
        // createTable();
      }
    }
    const landMark = document.getElementById("landMarkCheckBox");
    const detection = document.getElementById("detectionCheckBox");
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    if (landMark.checked) {
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }
    if (detection.checked) {
      faceapi.draw.drawDetections(canvas, resizedDetections);
    }
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 100);
});

function startRecording() {
  console.log("started");
  isRecording = true;
  // Clear out table
  // $("#tableData tr").remove();
  for (var member in expressions) delete expressions[member];
  emptyTable();

  document.getElementById("recordingStatus").innerHTML =
    "Recording is currently on.";
  document.getElementById("recordingStatus").style.color = "green";
  document.getElementById("startRecordingbtn").disabled = true;
  document.getElementById("startRecordingbtn").style.opacity = 0.3;
  document.getElementById("startRecordingbtn").style.cursor = "not-allowed";
}

function createTable() {
  let k = "<tbody>";
  console.log("this is the final expressions object");
  console.log(expressions);
  let totalExpressionsValue = findTotalValue();
  console.log(parseInt(totalExpressionsValue) + " this is the total value");
  calculatePercentage(parseInt(totalExpressionsValue));
  console.log("This is the percentages");
  console.log(expressions);
  k += "<tr>";
  k += insertRows("Angry");
  k += insertRows("Disgusted");
  k += insertRows("Fearful");
  k += insertRows("Happy");
  k += insertRows("Neutral");
  k += insertRows("Sad");
  k += insertRows("Surprised");

  k += "</tbody>";
  document.getElementById("tableData").innerHTML = k;
}

function insertRows(expression) {
  return (
    "<td>" +
    expression +
    "</td>" +
    "<td>" +
    expressions[expression.toLowerCase()] +
    "%" +
    "</td>" +
    "</tr>"
  );
}

function findTotalValue() {
  var total = 0;
  for (var i in expressions) {
    // Calculate total
    total += parseInt(expressions[i], 10);
  }
  return total;
}

function calculatePercentage(totalExpressionsValue) {
  for (var i in expressions) {
    // Calculate percentage
    expressions[i] = parseInt(
      (parseInt(expressions[i]) / totalExpressionsValue) * 100
    );
  }
}

function emptyTable() {
  let k = "<tbody>";
  k += "<tr>";
  k += "<td>" + "Angry" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "<td>" + "Disgusted" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "<td>" + "Fearful" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "<td>" + "Happy" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "<td>" + "Neutral" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "<td>" + "Sad" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "<td>" + "Surprised" + "</td>" + "<td>" + 0 + "%" + "</td>" + "</tr>";
  k += "</tbody>";
  document.getElementById("tableData").innerHTML = k;
}
