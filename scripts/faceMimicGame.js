var currentTimeLimit = 11;
var textSeconds = currentTimeLimit;
var allEmotions = ['angry','disgusted','fearful','happy','neutral','sad','surprised']
const givenExpressions = {};
const takenExpressions = {};
var detectionCanvas = null;
var canvas = null;
var width = 600; 
var height = 300;   
var level = 1;
var maxLvl = 1;
var streaming = false;
var interval;
var emotionValueLimit = 90;
var isPersonInPhoto = false;
const startGameButton = document.getElementById('start-game-button');
const currentLevel = document.getElementById('game-level');
const seconds = document.getElementById('second');
const nextLevelButton = document.getElementById('next-level-button');
const maxLevel = document.getElementById('max-game-level');
const resultText = document.getElementById('result-text');
const timeLeft = document.getElementById('second')
currentLevel.style.visibility = 'hidden';
nextLevelButton.style.visibility ='hidden';
timeLeft.style.visibility = 'hidden';
resultText.style.visibility = 'hidden';
var video = null;
var photoCanvas = null;
var photo = null;
var startbutton = null;

Promise.all([
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
]).then(startGame);

window.addEventListener('load', startCamera, false);
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
function countDown(){
  resultText.style.visibility = 'hidden'
  startGameButton.style.visibility = 'hidden'
  timeLeft.style.visibility = 'visible'
  currentLevel.style.visibility = 'visible'
  const controller = new AbortController()
  if(textSeconds > 0){
  textSeconds = textSeconds - 1 
  document.querySelector('.seconds').innerText = ("Time left: " + textSeconds.toString())
  }
  else{
    timeLeft.style.visibility = 'hidden'
    textSeconds = currentTimeLimit
    clearInterval(interval)
    if(checkLevel(checkEmotions())){
      increaseDificulty()
      level ++
      if(level > maxLvl) maxLvl=level;
        console.log(maxLvl)
        document.querySelector('.max-game-level').innerText = ("High Score: " + maxLvl.toString())
        document.querySelector('.game-level').innerText = ("Current level: " + level.toString())
        document.querySelector('.result-text').innerText = ('Success!\n'+ 'Proceed to next the level!')
        resultText.style.color = 'green'
        nextLevelButton.style.visibility ='visible'
        resultText.style.visibility = 'visible'
        nextLevelButton.addEventListener('click', async() =>{
          nextLevelButton.style.visibility ='hidden'
          if(canvas) canvas.remove()
          clearPhoto()
          isPersonInPhoto = false;
          emptyTable("takenImageData")
          changePhoto()
          interval = setInterval(countDown,1000);
          controller.abort()
       },{ signal: controller.signal })
  }
  else{
      level = 1
      emotionValueLimit = 90
      currentTimeLimit = 11
      textSeconds = currentTimeLimit
      document.querySelector('.game-level').innerText = ("Current level: " + level.toString())
      document.querySelector('.result-text').innerText = ('Game over!\nEmotion was not mimicked correctly!')
      resultText.style.color = 'red'
      currentLevel.style.visibility = 'hidden';
      startGameButton.style.visibility = 'visible';
      resultText.style.visibility = 'visible'
    startGameButton.addEventListener('click', async() =>{
        interval = setInterval(countDown,1000)
        if(canvas) canvas.remove()
        clearPhoto()
        isPersonInPhoto = false;
        emptyTable("takenImageData")
        changePhoto()
        controller.abort();
    },{ signal: controller.signal })
  }
  
}
}

function startGame(){
  const controller = new AbortController();
  emptyTable("gameImageData")
  
  document.querySelector('.game-level').innerText = ("Current level: " + level.toString())
  document.querySelector('.max-game-level').innerText = ("High Score: " + maxLvl.toString())
  startGameButton.addEventListener('click', async() =>{
    interval = setInterval(countDown,1000);
  changePhoto()
  controller.abort();
  
  },{ signal: controller.signal })
}
async function changePhoto(){
  const container = document.getElementById('third-box')
  container.style.position = 'relative'

  var imageNumber = 69000 + getRandomInt(300);
  var imageString = '/faces/' + imageNumber.toString() +'.png';
  const image = await faceapi.fetchImage([imageString])
  if(detectionCanvas) {
    console.log('removed');
    detectionCanvas.remove();}
  image.width = 600;
  image.height = 300;
  detectionCanvas = faceapi.createCanvasFromMedia(image)
  document.getElementById('imageUploadId').src=(imageString);
  container.append(detectionCanvas)
  const displaySize = {width: image.width, height: image.height}
  faceapi.matchDimensions(detectionCanvas,displaySize)
  const detections = await faceapi.detectAllFaces(image).withFaceExpressions()
  const resizedDetections = faceapi.resizeResults(detections,displaySize)
  resizedDetections.forEach(detection =>{
    const box = detection.detection.box
    const drawBox = new faceapi.draw.DrawBox(box, {label: 'Face'})
    drawBox.draw(detectionCanvas)
  })
  if(detections.length > 0 ){
  Object.keys(detections[0].expressions).map((expression) => {
    if (!givenExpressions[expression]) {
      givenExpressions[expression] = 0;
    }
    if (detections[0].expressions[expression]) {
      givenExpressions[expression] = detections[0].expressions[expression];
      console.log(givenExpressions[expression])
    }
  });
  createTable("gameImageData", givenExpressions)
  
}
else{ emptyTable("gameImageData")}

}


function startCamera() {
  const container = document.getElementById('first-box')
  container.style.position = 'relative'

  emptyTable("takenImageData")
  video = document.getElementById('video');
  photoCanvas = document.getElementById('canvas');
  photo = document.getElementById('photo');
  startbutton = document.getElementById('startbutton');
  navigator.mediaDevices.getUserMedia({video: true, audio: false})
  .then(function(stream) {
    video.srcObject = stream;
    video.play();
  })
  .catch(function(err) {
    console.log("An error occurred: " + err);
  });

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
    video.height=300
video.width= 510;
      video.setAttribute('width', 510);
      video.setAttribute('height', height);
      photoCanvas.setAttribute('width', width);
      photoCanvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  startbutton.addEventListener('click', async() =>{
    takepicture();
    if(canvas) {canvas.remove();}
    const image = await faceapi.fetchImage([photo.src])
    image.width = 600;
    image.height = 300;
    const displaySize = {width: image.width, height: image.height}
    canvas = faceapi.createCanvasFromMedia(image)
    faceapi.matchDimensions(canvas,displaySize)
    container.append(canvas)
    const detections =  await faceapi.detectAllFaces(image).withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections,displaySize)
    resizedDetections.forEach(detection =>{
      const box = detection.detection.box
      const drawBox = new faceapi.draw.DrawBox(box, {label: 'Face'})
      drawBox.draw(canvas)
    })
    if(detections.length > 0){
      isPersonInPhoto = true;
    console.log(detections.length)
    Object.keys(detections[0].expressions).map((expression) => {
      if (!takenExpressions[expression]) {
        takenExpressions[expression] = 0;
      }
      if (detections[0].expressions[expression]) {
        takenExpressions[expression] = detections[0].expressions[expression];
        console.log(takenExpressions[expression])
      }
    });
    createTable("takenImageData", takenExpressions)
  }
  else{
    isPersonInPhoto = false;
    emptyTable("takenImageData")
  }
  }, false);

  clearPhoto();
}
function checkEmotions(){
  var emotionDifferenceValue = 0; 
  for(var emotion in allEmotions){
    emotionDifferenceValue = emotionDifferenceValue + 
  (Math.abs((Math.round(givenExpressions[allEmotions[emotion]] * 100)) - (Math.round(takenExpressions[allEmotions[emotion]] * 100))))
  }
  return emotionDifferenceValue;
}
function checkLevel(emotionValue){
  if(!isPersonInPhoto) return false
  if (emotionValue > emotionValueLimit) return false
  else return true;
}
function increaseDificulty(){
  if(emotionValueLimit > 65) emotionValueLimit --;
  if(level % 2 == 0 && currentTimeLimit > 6) currentTimeLimit --;
}

function clearPhoto() {
  console.log('3')
  var context = photoCanvas.getContext('2d');
  context.clearRect(0, 0, photoCanvas.width, photoCanvas.height);


  var data = photoCanvas.toDataURL('image/png');
  photo.setAttribute('src', data);
}

function takepicture() {
  var context = photoCanvas.getContext('2d');
  if (width && height) {
    photoCanvas.width = width;
    photoCanvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    var data = photoCanvas.toDataURL('image/png');
    photo.setAttribute('src', data);
    

  
  } else {
    clearPhoto();
  }
}







function createTable(tableName, expressions) {
  let k = "<tbody>";
  k += "<tr>";
  k += insertRows(expressions, "Angry");
  k += insertRows(expressions, "Disgusted");
  k += insertRows(expressions, "Fearful");
  k += insertRows(expressions, "Happy");
  k += insertRows(expressions, "Neutral");
  k += insertRows(expressions, "Sad");
  k += insertRows(expressions, "Surprised");

  k += "</tbody>";
  document.getElementById(tableName).innerHTML = k;
}


function insertRows(expressions,expression) {
  return (
    "<td>" +
    expression +
    "</td>" +
    "<td>" +
    (Math.round(expressions[expression.toLowerCase()] * 100)) +
    "%" +
    "</td>" +
    "</tr>"
  );
}
function emptyTable(tableName) {
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
  document.getElementById(tableName).innerHTML = k;
}