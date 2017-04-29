//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
  return window.msBrowser ||
    window.browser ||
    window.chrome ||
    browser;
})();

function sendMessage(message) {
    if (window["safari"]) {
        safari.self.tab.dispatchMessage("message", message);
        return;
    }

    try {
        window.browser.tabs.query({ active: true }, function(tabs) { 
            window.browser.tabs.sendMessage(tabs[0].id, message, function(response) { }); 
        });
    }
    catch (e) {
        // Tab has probably been closed.
    }
};
//_____________________________________________________________________________________

var ui = null;
var help = null;
var wait = null;

// Display the capture UI.
window.addEventListener("DOMContentLoaded", function() {
    help = document.getElementById("help");

    helpSelected = document.getElementById("helpSelected");
    helpSelected.style.visibility = "hidden";
    helpSelected.style.display = "none";

    wait = document.getElementById("wait");
    wait.style.visibility = "hidden";
    wait.style.display = "none";

    var openCaptureFileElement = document.getElementById("openCaptureFile");
    openCaptureFileElement.addEventListener("dragenter", (e) => { this.drag(e); return false; }, false);
    openCaptureFileElement.addEventListener("dragover", (e) => { this.drag(e); return false; }, false);
    openCaptureFileElement.addEventListener("drop", (e) => { this.drop(e); }, false);

    initUI();
    refreshCanvases();
    playAll();
});

var drag = function(e) {
    e.stopPropagation();
    e.preventDefault();
}

var drop = function(eventDrop) {
    eventDrop.stopPropagation();
    eventDrop.preventDefault();

    this.loadFiles(eventDrop);
}

var loadFiles = function(event) {
    var filesToLoad = null;

    // Handling data transfer via drag'n'drop
    if (event && event.dataTransfer && event.dataTransfer.files) {
        filesToLoad = event.dataTransfer.files;
    }

    // Handling files from input files
    if (event && event.target && event.target.files) {
        filesToLoad = event.target.files;
    }

    // Load the files.
    if (filesToLoad && filesToLoad.length > 0) {
        for (let i = 0; i < filesToLoad.length; i++) {
            let name = filesToLoad[i].name.toLowerCase();
            let extension = name.split('.').pop();
            let type = filesToLoad[i].type;
            
            if (extension === "json") {
                const fileToLoad = filesToLoad[i];

                const reader = new FileReader();
                reader.onerror = e => {
                    console.error("Error while reading file: " + fileToLoad.name + e);
                };
                reader.onload = e => {
                    try {
                        window.browser.runtime.sendMessage({ captureString: e.target['result'] }, function(response) { });                        
                    }
                    catch (exception) {
                        console.error("Error while reading file: " + fileToLoad.name + exception);
                    }
                };
                reader.readAsText(fileToLoad);
            }
        }
    }
}

var initUI = function() {
    ui = new SPECTOR.EmbeddedFrontend.CaptureMenu({ eventConstructor: SPECTOR.Utils.Event }, new SPECTOR.Utils.ConsoleLogger());
    ui.onCanvasSelected.add(this.canvasSelected, this);
    ui.onPlayRequested.add(this.play, this);
    ui.onPlayNextFrameRequested.add(this.playNextFrame, this);            
    ui.onPauseRequested.add(this.pause, this);
    ui.onCaptureRequested.add(this.captureCanvas, this);
    ui.display();
}

var refreshCanvases = function() {
    window.browser.runtime.sendMessage({ refreshCanvases: true }, function(response) { });
}

var updateCanvasesListInformation = function (canvasesToSend) {
    ui.updateCanvasesListInformation(canvasesToSend);
}

var refreshFps = function(fps, frameId, tabId) {
    var canvasInfo = ui.getSelectedCanvasInformation();
    if (canvasInfo && canvasInfo.ref.tabId == tabId && canvasInfo.ref.frameId == frameId) {
        ui.setFPS(fps);
    }
}

var canvasSelected = function(info) {
    if (info) {
        help.style.visibility = "hidden";
        help.style.display = "none";
        helpSelected.style.visibility = "visible";
        helpSelected.style.display = "block";
    }
    else {
        help.style.visibility = "visible";
        help.style.display = "block";
        helpSelected.style.visibility = "hidden";
        helpSelected.style.display = "none";
    }
}

var playAll = function() {
    sendMessage({ action: "playAll" });
} 

var play = function(e) {
    if (e) {     
        sendMessage({ action: "play", canvasRef: e.ref });
    }
} 

var playNextFrame = function(e) {
    if (e) {       
        sendMessage({ action: "playNextFrame", canvasRef: e.ref });
    }
} 

var pause = function(e) {
    if (e) {
        sendMessage({ action: "pause", canvasRef: e.ref });
    }
}

var captureCanvas = function(e) {
    if (e) {    
        help.style.visibility = "hidden";
        help.style.display = "none";
        helpSelected.style.visibility = "hidden";
        helpSelected.style.display = "none";
        wait.style.visibility = "visible";
        wait.style.display = "block";

        sendMessage({ action: "capture", canvasRef: e.ref });
    }
}