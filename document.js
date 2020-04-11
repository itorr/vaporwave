
const readFileToURL = (file,onOver)=>{
	var reader = new FileReader();
	reader.onload = ()=>{
		const src = reader.result;
		onOver(src);
	};
	reader.readAsDataURL(file);
};

const readFileAndSetIMGSrc = file=>{
	readFileToURL(file,src=>{
		const img = new Image();
		img.src = src;
		img.onload = ()=>{
			app.img = img;
			vaporwave(img,app.style, src=>{
				app.src = src;
			});
		}
	});
};

const isImageRegex = /^image\/(jpeg|gif|png|bmp|webp)$/;

document.addEventListener('paste',e=>{
	// console.log(e.clipboardData,e.clipboardData.files);

	const clipboardData = e.clipboardData;
	if(clipboardData.items[0]){
		let file = clipboardData.items[0].getAsFile();

		if(file && isImageRegex.test(file.type)){
			return readFileAndSetIMGSrc(file);
		}
	}

	if(clipboardData.files.length){
		for(let i = 0;i<clipboardData.files.length;i++){
			if(isImageRegex.test(clipboardData.files[i].type)){
				console.log(clipboardData.files[i])
				readFileAndSetIMGSrc(clipboardData.files[i]);
			}
		}
	}
});

document.addEventListener('dragover',e=>{
	e.preventDefault();
});
document.addEventListener('drop',e=>{
	e.preventDefault();

	const file = e.dataTransfer.files[0];

	if(file && file.type.match(isImageRegex)){
		readFileAndSetIMGSrc(file);
	}
});

const _vaporwave = (img,style,callback)=>{

	clearTimeout(vaporwave.T);
	vaporwave.T = setTimeout(()=>{
		vaporwave(img,style,callback);
		app.saveData();
	},100);
};

const deepCopy = o=>JSON.parse(JSON.stringify(o));

const defaultStyle = {

	zoom: 1,

	light: 1,
	contrast: 1,

	darkFade:0,
	brightFade:0,

	shiftX: 0,
	shiftY: 0,

	shiftU: 0,
	shiftV: 0,


	level: 4, //颜色断层

	interlaced: 0, //隔行扫描
	interlacedStrong:1,
	interlacedLine:2,



	transposeX: 0,
	transposePow: 4,
	transposeNoise:0,

	replace:0,

	vividU : 1,
	vividV : 1,

	sizeOrigin: false,
	sharpen: true,
	invertLight: false,

	yuv420:true,
	yuv420Noise:1,

	snow:false,
	quality:0.6,
	damage:0,

	ratio:1,


	lightNoise:0, //明度噪声
	darkNoise:0, //胶片噪声

	fit:'cover',

	border:0,

	none:false,

	watermark:false,
	watermarkSize:0.7,

	watermarkLeft:0.5,
	watermarkTop:0.75,

	watermarkAlpha:1,

	styleName:false,

};



const userStyles = JSON.parse(localStorage.getItem('userStyles')||'[]');

const data = {
	src:'',
	img:null,
	showStyle:true,
	style:{
		...defaultStyle,
		...styles[0]
	},
	styles,
	userStyles,
	globalStyles:[],
	images
};

const isKanjiRegex = /^[\u0800-\u9fa5]+$/;

const diffDefaultStyle = style=>{
	for(let key in style){
		if(style[key] === defaultStyle[key]){
			delete style[key];
		}
	}
};




const chooseFile = callback=>{
	chooseFile.form.reset();
	chooseFile.input.onchange = function(){
		if(!this.files||!this.files[0])return;
		callback(this.files[0]);
	};
	chooseFile.input.click();
};
chooseFile.form = document.createElement('form');
chooseFile.input = document.createElement('input');
chooseFile.input.type = 'file';
chooseFile.form.appendChild(chooseFile.input);

const request = (method,uri,data,callback)=>{
	let body = null;
	if(data){
		body = JSON.stringify(data);
	}
	fetch(uri,{
		method,
		mode: 'cors',
		body,
		credentials: 'include',
		headers: {
			'content-type': 'application/json'
		}
	}).then(res => res.json()).then(data => callback(data)).catch(error => console.error(error))
};

const API_URL = 'https://lab.magiconch.com/api/vaporwave/';

request('GET',API_URL+'style',null,styles=>app.globalStyles = styles);

const uploadImage = options =>{
	if(!options) return;


	const file = options.file;

	if(!file.type.match(/^image\//)) return console.log(/文件类型不正确/,file);


	const callback = options.callback;
	const plan = options.plan;

	request('POST',API_URL.replace(/vaporwave\//,'upyun/authorization'),{
		plan,
	},upyun=>{

		let body = new FormData();

		body.append('file', file);
		body.append('policy', upyun.policy);
		body.append('authorization', upyun.authorization);

		fetch(upyun.api + upyun.bucket,{
			method:'POST',
			mode: 'cors',
			body,
		}).then(res => res.json()).then(data =>{
			data.imageURL = `${upyun.prefix}${data.url}`;
			callback(data);
		}).catch(error => console.error(error))
	});
};

const postStyle = ()=>{
	const name = prompt('输入四字中日文滤镜名（务必是四个中日文字）\n提交预设会上传当前画面图像为预览');

	if(!name) return;
	if(!isKanjiRegex.test(name.trim())) return alert('这不是四字中日文，请检查后重新提交');

	let author = prompt('输入作者信息（可留空）');

	if(!author){
		author = undefined;
	}

	style = deepCopy(app.style);
	diffDefaultStyle(style);

	style.name = name;

	canvas.toBlob(file=>{
		uploadImage({
			file,
			plan:'output',
			callback(r){
				request('POST',API_URL+'style',{
					preview:r.imageURL,
					author,
					style
				},()=>{
					alert('感谢提交公共预设，审核通过即会在公共样式中出现。');
				});
			}
		});
	},'image/jpeg',app.style.quality);
};


const uploadCapture = ()=>{
	let author = prompt('输入作者信息（可留空）');

	if(!author){
		author = undefined;
	}

	chooseFile(file=>{
		uploadImage({
			file,
			plan:'capture',
			callback(r){
				request('POST',API_URL+'capture',{
					src:r.imageURL,
					author
				},()=>{
					alert('感谢提交样图，经过审核通过就有可能展示在界面上。');
				});
			}
		});
	});
};


const setLogoFromFile = ()=>{
	chooseFile(file=>{
		readFileToURL(file,src=>setLogoByURL(src,app.vaporwave));
	});
};



const app = new Vue({
	el:'.app',
	data,
	methods: {
		setStyle(style){
			this.style = deepCopy({
				...defaultStyle,
				...style
			});
			this.vaporwave();
		},
		addStyle(){
			const name = prompt('输入四字中日文滤镜名（务必是四个中日文字）');
			if(!name) return;
			if(!isKanjiRegex.test(name.trim())) return alert('这不是四字中日文，请检查后重新提交');


			const style = deepCopy(this.style);

			style.name = name;

			diffDefaultStyle(style);

			console.log(JSON.stringify(style,0,4));
			this.userStyles.push(style);
			this.saveData();
		},
		removeUserStyle(style){
			if(confirm('确定删除这条预设？删除后不可恢复')){
				this.userStyles.splice(this.userStyles.indexOf(style),1);
			}
			this.saveData();
		},
		saveData(){
			localStorage.setItem('userStyles',JSON.stringify(app.userStyles));
		},
		_vaporwave(){
			_vaporwave(this.img,this.style,src=>{
				app.src = src;
			});
		},
		vaporwave(){
			vaporwave(this.img,this.style,src=>{
				app.src = src;
			});
		},
		setImageAndDraw(e){
			this.img = e.target;

			this.vaporwave();
		},
		voteStyle(){

		},
		output(){
			const a = document.createElement('a');
			a.href = this.src;
			a.download = `[lab.magiconch.com][90s-time-machine]-${+Date.now()}.jpg`;
			a.click();
		},
		chooseFile(){
			chooseFile(readFileAndSetIMGSrc)
		},
		postStyle,
		uploadCapture,
		setLogoFromFile
	},
	watch:{
		style:{
			deep:true,
			handler(){
				this._vaporwave();
			}
		}
	}
});



const loadScript = (src,el) =>{
	el = document.createElement('script');
	el.src = src;
	document.body.appendChild(el);
};

setTimeout(()=>{
	loadScript('//s4.cnzz.com/z_stat.php?id=1278706389&web_id=1278706389');
},400);