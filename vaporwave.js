/**
 * @author itorr<https://github.com/itorr>
 * @date 2020-04-08
 * @Description 蒸汽波风格化处理
 * */

const rgb2yuv = (r,g,b)=>{
	var y, u, v;

	y = r *  .299000 + g *  .587000 + b *  .114000;
	u = r * -.168736 + g * -.331264 + b *  .500000 + 128;
	v = r *  .500000 + g * -.418688 + b * -.081312 + 128;

	y = Math.floor(y);
	u = Math.floor(u);
	v = Math.floor(v);

	return [y,u,v];
};

const yuv2rgb = (y,u,v)=>{
	var r,g,b;

	r = y + 1.4075 * (v - 128);
	g = y - 0.3455 * (u - 128) - (0.7169 * (v - 128));
	b = y + 1.7790 * (u - 128);

	r = Math.floor(r);
	g = Math.floor(g);
	b = Math.floor(b);

	r = (r < 0) ? 0 : r;
	r = (r > 255) ? 255 : r;

	g = (g < 0) ? 0 : g;
	g = (g > 255) ? 255 : g;

	b = (b < 0) ? 0 : b;
	b = (b > 255) ? 255 : b;

	return [r,g,b];
};

const randRange =(a,b)=>Math.floor(Math.random()*(b-a)+a);

const Convolutes = {
	'右倾':[
		0, -1,  0,
		-1, 2,  2,
		0, -1,  0
	],
	'左倾':[
		0, -1,  0,
		3,  2, -2,
		0, -1,  0
	],
	'桑拿':[
		1/9, 1/9, 1/9,
		1/9, 1/9, 1/9,
		1/9, 1/9, 1/9
	],
	// '桑拿':[
	// 	1/25,1/25,1/25,1/25,1/25,
	// 	1/25,1/25,1/25,1/25,1/25,
	// 	1/25,1/25,1/25,1/25,1/25,
	// 	1/25,1/25,1/25,1/25,1/25,
	// 	1/25,1/25,1/25,1/25,1/25,
	// ],
	'浮雕':[
		1,1,1,
		1,1,-1,
		-1,-1,-1
	]
}


const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');


let width  = 640;
let height = 480;
let scale  = width / height;



let lastConfigString = null;
const vaporwave = (img, config, callback)=>{
	if(!img || !config) return;

	const configString = [
		JSON.stringify(config),
		img.src,
		logoImageEl.src
	].join('-');

	if(lastConfigString === configString) return;

	lastConfigString = configString;

	const oriWidth  = img.naturalWidth;
	const oriHeight = img.naturalHeight;

	let oriScale = oriWidth / oriHeight;


	if(!config.sizeOrigin){
		switch(config.wide){
			case '16:9':
				width  = 720;
				height = 405;
				break;
			case '21:9':
				width  = 748;
				height = 320;
				break;
			case '1:1':
				width  = 500;
				height = 500;
				break;
			default:
				width  = 640;
				height = 480;
				break;
		}
	}else{
		width  = oriWidth;
		height = oriHeight;
		if(width > 1920){
			height = 1920 / width * height;
			width = 1920;
		}
	}

	scale = width / height;


	const _width  = Math.floor( width  / config.zoom );
	const _height = Math.floor( height / config.zoom );


	canvas.width  = _width;
	canvas.height = _height;

	let cutLeft = 0;
	let cutTop  = 0;

	let calcWidth  = oriWidth;
	let calcHeight = oriHeight;


	let setLeft = 0;
	let setTop  = 0;

	let setWidth  = _width;
	let setHeight = _height;


	if(config.fit === 'cover'){

		scale = scale * config.ratio;

		if(oriScale > scale){
			cutLeft = ( oriWidth - oriHeight * scale )/2;
			calcWidth = oriHeight * scale;
			calcHeight = oriHeight;
		}else{
			cutTop  = ( oriHeight - oriWidth / scale )/2;
			calcWidth = oriWidth;
			calcHeight = oriWidth / scale;
		}
	}else if(config.fit === 'contain'){
		scale = scale * config.ratio;
		oriScale = oriScale / config.ratio;

		if(oriScale > scale){ //原图更宽
			setWidth  = _width;
			setHeight = _width / oriScale;
			setTop  = ( _height - setHeight )/2;
		}else{
			setWidth  = _height * oriScale;
			setHeight = _height;
			setLeft = ( _width - setWidth )/2;
		}
	}else{

	}


	// console.log(cutLeft,cutTop);
	// console.log(calcWidth,calcHeight);
	// console.log(setLeft,setTop);



	if(config.border){
		const leftBorder = setWidth * config.border/200;
		const topBorder = setHeight * config.border/200;
		setLeft += leftBorder;
		setTop  += topBorder;
		setWidth  -= leftBorder * 2;
		setHeight -= topBorder * 2;
	}



	ctx.drawImage(
		img,
		cutLeft,cutTop,
		calcWidth,calcHeight,

		setLeft,setTop,
		setWidth,setHeight
	);


	if(config.none) return imageOutput(canvas,config,callback);


	if(config.watermark){

		const watermarkSetWidth  = _width * config.watermarkSize;
		const watermarkSetHeight = watermarkSetWidth * logoImageEl.naturalHeight / logoImageEl.naturalWidth;

		const watermarkSetLeft = _width  * config.watermarkLeft - watermarkSetWidth/2;
		const watermarkSetTop  = _height * config.watermarkTop  - watermarkSetHeight/2;

		ctx.globalAlpha = config.watermarkAlpha;
		ctx.drawImage(
			logoImageEl,
			watermarkSetLeft,watermarkSetTop,
			watermarkSetWidth,watermarkSetHeight
		);

		ctx.globalAlpha = 1;
	}

	if(config.styleName){

		const styleFontSize = _width/15 * config.styleSize;

		ctx.font = `bold ${styleFontSize}px/1 sans-serif`;
		ctx.fillStyle = '#FFF';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			config.name,
			_width * config.styleLeft,// - styleFontSize * 2,
			_height * config.styleTop// - styleFontSize/2
		);
	}


	let pixel = ctx.getImageData(0,0,_width,_height);



	let pixelData = pixel.data;


	let shiftUPixel = 4 * config.shiftX + 4 * _width * config.shiftY;
	let shiftVPixel = 4 * (config.shiftX + config.shiftY);


	if(config.snow){
		// // console.log(lastShowPixel,lastShowPixel&&lastShowPixel.width,pixel.width);
		// if(lastShowPixel && lastShowPixel.width === pixel.width){
		// 	pixel     = lastShowPixel;
		// 	pixelData = lastShowPixel.data;
		// }else{

			pixel = ctx.createImageData(pixel.width, pixel.height);
			pixelData = pixel.data;

			const linex = 2 * 4 * _width;

			for(let i = 0;i < pixelData.length;i += 4){
				pixelData[i                 ] = randRange(0,25)*10;//Math.floor(i / (style.light+1)/1000 % 200) + randRange(0,55);
				pixelData[i+1 - shiftUPixel ] = randRange(108,148);//randRange(68,188);
				pixelData[i+2 - shiftVPixel ] = randRange(118,138);
				pixelData[i+3 - shiftVPixel ] = 255;

				if(Math.floor(i/4/_width)%2 === 0){
					pixelData[i - shiftUPixel - linex] = pixelData[i - shiftUPixel ] + 100;
				}
			}
		// }

	}else{



		if(config.replace) {
			for (let i = 0; i < pixelData.length; i ++) {
				pixelData[i - config.replace] = pixelData[i]
			}
		}
		if(config.sharpen){
			pixel = convolute(
				pixel,
				Convolutes[config.convoluteName]||Convolutes['右倾']
			);
			pixelData = pixel.data;
		}

		const UVshifting = (yuv)=>{

			const levelLower = num=>Math.round(num / config.level) * config.level;

			yuv[0] = ((yuv[0] - 128)*config.contrast + 128);

			yuv[0] = yuv[0] * config.light;

			yuv[0] = Math.max(yuv[0],config.darkFade);
			yuv[0] = Math.min(yuv[0],255-config.brightFade);


			yuv[1] = Math.min(255, (yuv[1]-128) * config.vividU + config.shiftU + 128 );
			yuv[2] = Math.min(255, (yuv[2]-128) * config.vividV + config.shiftV + 128 );

			yuv[1] = levelLower(yuv[1]);
			yuv[2] = levelLower(yuv[2]);
			return yuv;
		};


		for(let i = 0;i < pixelData.length;i += 4){
			let yuv = rgb2yuv(
				pixelData[i  ],
				pixelData[i+1],
				pixelData[i+2],
			);

			// UV 漂移
			yuv = UVshifting(yuv,config);

			pixelData[i                 ] = yuv[0];
			pixelData[i+1 - shiftUPixel ] = yuv[1];
			pixelData[i+2 - shiftVPixel ] = yuv[2];

		}
	}


	if(config.yuv420){
		const p = 4;
		const s = Math.sqrt(p);
		let maxX = Math.floor(_width/s);
		let maxY = Math.floor(_height/s);
		const lineP = Math.floor(config.yuv420Noise * 4 * _width); //一排像素数
		const pixelLength= pixelData.length;

		for(let x=0;x < maxX;x++){
			for(let y=0;y < maxY;y++){
				const i = y * s * 4 * _width + x * s * 4;

				// for(let si=0;si<s;si++){
				//
				// }
				pixelData[(i + 1)%pixelLength] =
				pixelData[(i + 1 + 4)%pixelLength] =
				pixelData[(i + 1 + lineP)%pixelLength] =
				pixelData[(i + 1 + lineP + 4)%pixelLength] = (
					pixelData[(i + 1)%pixelLength] +
					pixelData[(i + 1 + 4)%pixelLength] +
					pixelData[(i + 1 + lineP)%pixelLength] +
					pixelData[(i + 1 + lineP + 4)%pixelLength]
				)/p;


				pixelData[(i + 2)%pixelLength] =
				pixelData[(i + 2 + 4)%pixelLength] =
				pixelData[(i + 2 + lineP)%pixelLength] =
				pixelData[(i + 2 + lineP + 4)%pixelLength] = (
					pixelData[(i + 2)%pixelLength] +
					pixelData[(i + 2 + 4)%pixelLength] +
					pixelData[(i + 2 + lineP)%pixelLength] +
					pixelData[(i + 2 + lineP + 4)%pixelLength]
				)/p;
			}
		}

	}


	if(config.interlaced || config.interlacedLight) {
		// // console.log(lastShowPixel,lastShowPixel&&lastShowPixel.width,pixel.width);
		// if(lastShowPixel && lastShowPixel.width === pixel.width){
		// 	pixel     = lastShowPixel;
		// 	pixelData = lastShowPixel.data;
		// }else{

		// const linex = 4 * _width;

		// for (let i = 0; i < pixelData.length; i += 4) {
		//
		// 	if (Math.floor(i / linex / config.interlacedLine) % 2 === 0) {
		// 		pixelData[i - linex - config.interlaced * 4] = pixelData[i - linex];
		// 	}
		// }

		const interlacedLight = Math.pow(config.interlacedLight,2);

		for (let hi = 0; hi < _height; hi++) {

			const interlacePeriod = (hi % config.interlacedLine) / config.interlacedLine;
			const interlacePixel = Math.abs(interlacePeriod - 0.5) * 2;
			let wLeft = Math.ceil( config.interlaced * interlacePixel ) * 4;

			const interlaceLightPeriod = (interlacePixel - 0.5) * 2;

			// console.log(wLeft);

			for (let wi = 0; wi < _width; wi++) {
				let i = (_width * hi + wi) * 4;

				pixelData[i - wLeft] = pixelData[i] * ( 1 + interlacedLight * interlaceLightPeriod);
				// pixelData[yi + 1] = pixelData[i + 1];
				// pixelData[yi + 2] = pixelData[i + 2];
			}
		}
	}

	if(config.transposeX){
		for (let hi = 0; hi < _height; hi++) {

			let wLeft = Math.floor(_width  * config.transposeX * Math.pow((hi/_height),config.transposePow) * (1 + config.transposeNoise * (Math.random()-0.5))) * 4;

			// console.log(wLeft);

			for (let wi = 0; wi < _width; wi++) {
				let i = (_width * hi + wi) * 4;

				pixelData[i - wLeft] = pixelData[i];
				// pixelData[yi + 1] = pixelData[i + 1];
				// pixelData[yi + 2] = pixelData[i + 2];
			}
		}
	}


	if(config.invertLight){
		for (let i = 0; i < pixelData.length; i +=4) {
			pixelData[i] = 255 - pixelData[i]
		}
	}

	if(config.lightNoise){
		let halt = config.lightNoise/2;
		for (let i = 0; i < pixelData.length; i +=4) {
			pixelData[i] = pixelData[i] + (randRange(0,config.lightNoise) - halt)// * (255 - pixelData[i])/255;
		}
	}
	if(config.darkNoise){
		let halt = config.darkNoise/2;
		for (let i = 0; i < pixelData.length; i +=4) {
			pixelData[i] = pixelData[i] + (randRange(0,config.darkNoise) - halt) * (255 - pixelData[i])/255;
			//噪声在亮部不那么明显
		}
	}


	for(let i = 0;i < pixelData.length;i += 4){

		let _rgb = yuv2rgb(
			pixelData[i],
			pixelData[i+1],
			pixelData[i+2],
		);

		pixelData[i   ] = _rgb[0];
		pixelData[i+1 ] = _rgb[1];
		pixelData[i+2 ] = _rgb[2];
	}

	// blurC();
	ctx.putImageData(pixel,0,0);



	imageOutput(canvas,config,callback);



	// callback();
};

const imageOutput = (canvas,config,callback)=>{

	const src = canvas.toDataURL('image/jpeg',config.quality);
	if(config.zoom !== 1 && !config.sizeOrigin){
		imageResizeOutput(src,config,callback)
	}else{
		callback(src);
	}
};

const imageResizeOutput = (src,config,callback)=>{
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');


	canvas.width  = width;
	canvas.height = height;

	const img = new Image();

	img.onload = ()=>{
		ctx.drawImage(img,0,0,width,height);
		callback(canvas.toDataURL('image/jpeg',config.quality));
	};
	img.src = src;
};



const convolute = (pixels, weights)=>{
	const side = Math.round(Math.sqrt(weights.length));
	const halfSide = Math.floor(side/2);

	const src = pixels.data;
	const sw = pixels.width;
	const sh = pixels.height;

	const w = sw;
	const h = sh;
	const output = ctx.createImageData(w, h);
	const dst = output.data;


	for (let y=0; y<h; y++) {
		for (let x=0; x<w; x++) {
			const sy = y;
			const sx = x;
			const dstOff = (y*w+x)*4;
			let r=0, g=0, b=0;
			for (let cy=0; cy<side; cy++) {
				for (let cx=0; cx<side; cx++) {
					const scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
					const srcOff = (scy*sw+scx)*4;
					const wt = weights[cy*side+cx];
					r += src[srcOff  ] * wt;
					g += src[srcOff+1] * wt;
					b += src[srcOff+2] * wt;
				}
			}
			dst[dstOff  ] = r;
			dst[dstOff+1] = g;
			dst[dstOff+2] = b;
			dst[dstOff+3] = 255;
		}
	}


	// for (let y=0; y<h; y++) {
	// 	for (let x=0; x<w; x++) {
	// 		const srcOff = (y*w+x)*4;
	// 		src[srcOff] = dst[srcOff];
	// 	}
	// }
	return output;
};


const logoImageEl = new Image();
logoImageEl.crossorigin = 'Anonymous';
logoImageEl.src = 'logo.png';

const setLogoByURL = (src,callback)=>{
	logoImageEl.onload = callback;
	logoImageEl.src = src;
};
