function Display(canvasSelector = '#display') {
	this.canvasSelector = canvasSelector;
	this.c = document.querySelector(this.canvasSelector);
	this.pixelHeight = 10;
	this.pixelWidth = 10;
	this.backColor = '#FFF';
	this.foreColor = '#000';

	if (this.c.dataset.backgroundColor != undefined)
		this.backColor = this.c.dataset.backgroundColor;
	if (this.c.dataset.foregroundColor != undefined)
		this.foreColor = this.c.dataset.foregroundColor;

	if (this.c.attributes.getNamedItem('width') == undefined || this.c.attributes.getNamedItem('height') == undefined) {
		throw new Error("Must set height and width on canvas element (in html).");
	}
	if (this.c.dataset.density == undefined && (this.c.dataset.pixelHeight == undefined && this.c.dataset.pixelWidth == undefined)) {
		throw new Error("Must set 'data-density', or 'data-pixel-height' and 'data-pixel-width' on canvas element.");
	}
	if (this.c.dataset.density == undefined) {
		this.pixelHeight = this.c.dataset.pixelHeight;
		this.pixelWidth = this.c.dataset.pixelWidth;
	} else {
		this.pixelHeight = this.c.height / this.c.dataset.density;
		this.pixelWidth = this.c.width / this.c.dataset.density;
	}
	this.cx = this.c.getContext('2d');
}

Display.prototype.renderArray = function(array) {
	var height = this.c.height / this.pixelHeight;
	var width = this.c.width / this.pixelWidth;
	
	if (array.length != height * width) {
		throw new Error("Trying to render array with a different amount of pixels from the canvas. Array must be " + height + " by " + width + ".");
	}

	var k = 0;
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			if (array[k] == 1) {
				this.cx.fillStyle = this.foreColor;
			} else {
				this.cx.fillStyle = this.backColor;
			}
			this.cx.fillRect(j * this.pixelWidth, i * this.pixelHeight, this.pixelWidth, this.pixelHeight);
			k++;
		}
	}
}

Display.prototype.renderImage = function(url, h = 0, w = 0, x = 0, y = 0) {	
	var img = new Image;
	img.t = this;
	img.onload = function() { this.t.pixelateImage(img, h, w, x, y); };
	img.src = url;
}

Display.prototype.pixelateImage = function(img, h, w, x, y) {
	var height = this.c.height / this.pixelHeight;
	var width = this.c.width / this.pixelWidth;
	var totalPixels = height * width;
	
	if (h == 0) { h = height; }
	if (w == 0) { w = width; }
		
	var tempCanvas = document.createElement('canvas');
	var tempCtx = tempCanvas.getContext('2d');
	tempCanvas.width = this.c.width;
	tempCanvas.height = this.c.height;
		
	tempCtx.drawImage(img, x, y, w*this.pixelWidth, h*this.pixelHeight);
	
	try {
		imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
	} catch (error) {
		throw new Error(error);
	}
	
	var pixel = [];
	var k = 0;
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			var pixelData = tempCtx.getImageData(j * this.pixelWidth, i * this.pixelHeight, this.pixelWidth, this.pixelHeight);
			pixel[k] = [0,0,0,0];
			var count = 0;
			for (var l = 0; l < pixelData.data.length; l+=4) {
				count++;
				pixel[k][0] += pixelData.data[l];
				pixel[k][1] += pixelData.data[l+1];
				pixel[k][2] += pixelData.data[l+2];
				pixel[k][3] += pixelData.data[l+3];
			}
			pixel[k][0] = ~~(pixel[k][0]/(count));
			pixel[k][1] = ~~(pixel[k][1]/(count));
			pixel[k][2] = ~~(pixel[k][2]/(count));
			pixel[k][3] = ~~(pixel[k][3]/(count));
			k++;
		}
	}
		
	var k = 0;
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			this.cx.fillStyle = 'rgba(' + pixel[k][0] + ',' + pixel[k][1] + ',' + pixel[k][2] + ',' + pixel[k][3] + ')';
			this.cx.fillRect(j * this.pixelWidth, i * this.pixelHeight, this.pixelWidth, this.pixelHeight);
			k++;
		}
	}
}

Display.prototype.clear = function() {
	this.cx.clearRect(0,0,this.c.width,this.c.height);
}

function Animation(display, frames, delay = 500) {
	if (!display instanceof Display) {
		throw new Error("Display must be a valid Display object.");
	}
	this.display = display;
	this.frames = frames;
	this.delay = delay;
	this.running = false;
}

Animation.prototype.start = function() {
	this.running = true;
	var i = 0;
	this.intervalId = window.setInterval(function(self) {
		self.display.renderArray(self.frames[i]);
		i++;
		if (self.frames.length == i) {
			i = 0;
		}
	}, this.delay, this);
}

Animation.prototype.stop = function() {
	window.clearInterval(this.intervalId);
	this.running = false;
}