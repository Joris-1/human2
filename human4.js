import Human from '@vladmandic/human'
//const Human = require('@vladmandic/human')

const functionsStr =
  `
    <header> 
    <script src="https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.esm.js"></script>
    </header>
  <body>  
    <video
      id="inputVideo"
      autoplay
      muted
      width="640"
      height="480"
      style="border: 1px solid #ddd;"
    ></video
    ><br />
    <canvas
      id="overlay"
      width="640"
      height="480"
      style="position: relative; top: -487px; border: 1px solid #ddd;"
    ></canvas
    ><br/>
  </body>
        `;

class cam extends HTMLElement {

  constructor() {
    super();
    //this.attachShadow({ mode: 'open' })
    this.innerHTML = functionsStr
  }

  connectedCallback() {

    run()

    async function run() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      const videoEl = document.getElementById("inputVideo");
      videoEl.srcObject = stream;

      const config = { backend: 'webgl' };
      const human = new Human(config); // create instance of Human
      const inputVideo = document.getElementById("inputVideo");
      const outputCanvas = document.getElementById('overlay');



      async function detectionLoop() { // main detection loop
        if (inputVideo.paused) {
          // console.log('profiling data:', await human.profile(inputVideo));
          await human.detect(inputVideo.video); // actual detection; were not capturing output in a local variable as it can also be reached via human.result
          const tensors = human.tf.memory().numTensors; // check current tensor usage for memory leaks
          //if (tensors - timestamp.tensors !== 0) log('allocated tensors:', tensors - timestamp.tensors); // printed on start and each time there is a tensor leak
          //timestamp.tensors = tensors;
        }
        console.log(human.result)
        const now = human.now();
        //fps.detect = 1000 / (now - timestamp.detect);
        //timestamp.detect = now;
        requestAnimationFrame(detectionLoop); // start new frame immediately
      }

      setTimeout(function () { 
        detectionLoop()
        drawLoop()
       }, 3000);

      async function drawLoop() { // main screen refresh loop
        if (inputVideo.paused) {
          const interpolated = await human.next(human.result); // smoothen result using last-known results
          if (human.config.filter.flip) await human.draw.canvas(interpolated.canvas as HTMLCanvasElement, outputCanvas); // draw processed image to screen canvas
          else await human.draw.canvas(inputVideo, outputCanvas); // draw original video to screen canvas // better than using procesed image as this loop happens faster than processing loop
          await human.draw.all(outputCanvas, interpolated); // draw labels, boxes, lines, etc.
          perf(interpolated.performance); // write performance data
        }
        const now = human.now();
        fps.draw = 1000 / (now - timestamp.draw);
        timestamp.draw = now;
        status(inputVideo.paused ? 'paused' : `fps: ${fps.detect.toFixed(1).padStart(5, ' ')} detect | ${fps.draw.toFixed(1).padStart(5, ' ')} draw`); // write status
        // requestAnimationFrame(drawLoop); // refresh at screen refresh rate
        setTimeout(drawLoop, 30); // use to slow down refresh from max refresh rate to target of 30 fps
      }

    }


  }



  static get observedAttributes() {
    return ['element-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log({ name: name, newValue: newValue })
    const elemenPosition = document.getElementById(newValue).getBoundingClientRect();
    this.dispatchEvent(new CustomEvent('element-data', { detail: elemenPosition }));
  }

}

customElements.define('cam-tag', cam);
