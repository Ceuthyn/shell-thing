let token = sessionStorage.getItem("token");
if(!token) window.location.href = "/login";

let root;
(async ()=>{
	let res = await fetch("/api/restore", {
		method: "GET",
		headers:{
			"x-token": token
		}
	});
	if(res.status != 200){
		window.location.href = "/login";
	};

	root = await res.json();
})();

class file {
	constructor(name, type = 0, content = ""){
		this.name = name;
		this.type = type;
		this.content = content;
		this.children = {};
	}
};

let FTYPE = {
	FILE: 0,
	DIR: 1
};
Object.freeze(FTYPE);

function getfile(path){
	let frag = path.split("/");
	let lroot = root;
	for(let i = 1; i<frag.length; i++){
		if(!lroot.children[frag[i]]) return -1;
		lroot = lroot.children[frag[i]];
	};
	return lroot;
};

function write(path, content){
	let file = getfile(path);
	if(file == -1) return -1;
	if(file.type != FTYPE.FILE) return -2;
	file.content = content;
};

function read(path){
	let file = getfile(path);
	if(file == -1) return -1;
	if(file.type != FTYPE.FILE) return -2;
	return file.content;
};

function deletef(path){
	let file = getfile(path);
	if(file == -1) return -1;
	if(Object.keys(file.children).length != 0) return -2;
	//TODO finish
};

function create(path, type){
	let frag = path.split("/");
	let lroot = root;
	let i = 1;
	while(i<frag.length-1){
		if(lroot.type == FTYPE.FILE) return -1;
		if(lroot.children[frag[i]] == undefined){
			lroot.children[frag[i]] = new file(frag[i], FTYPE.DIR);
		};
		lroot = lroot.children[frag[i]];
		i++;
	};

	if(lroot.children[frag[i]] != undefined) return -2;
	lroot.children[frag[i]] = new file(frag[i], type);
};

function readdir(path){
	let file = getfile(path);
	if(file == -1) return -1;
	if(file.type != FTYPE.DIR) return -2;
	return Object.keys(file.children);
};

function execute(path, args){
	let file = read(path);
	if(typeof(file) != "string") return file;
	let func = new Function(file);
	return func.apply(null, [...args]);
};

let workingdir = "/home";

let inp = document.getElementById("inp-text");
let body = document.getElementById("main");

addEventListener("keydown", (e)=>{
	console.log(e.key, e); //DEBUG
	if((e.keyCode >= 65 && e.keyCode <= 90) ||
	(e.keyCode >= 48 && e.keyCode <= 57)){
		inp.textContent += e.key;
	}; //a-z, 0-9 + symbols
	
	switch(e.keyCode){
		case 8: //backspace
			inp.textContent = inp.textContent.slice(0, inp.textContent.length -1);
		break;

		case 9: //tab
			//TODO: complete
		break;

		case 13: //enter
			parse(inp.textContent);
			inp.textContent = "";
		break;

		case 32: //space
			inp.textContent += " ";
		break;

		case 38: //up arrow
			//TODO
		break;

		case 40: //down arrow
			//TODO
		break;

		case 188: // , and <
		case 190: // . and >
		case 191: // / and ?
		case 192: // ` and ~
			inp.textContent += e.key;
		break;

		default: break;
	};
});

function parse(text){
	log(text);
	try{
		let parts = text.split(" ");
		if(getfile(`/bin/${parts[0]}`) == -1){
			log("command not found");
			return;
		};
		let ret = execute(`/bin/${parts[0]}`, parts);
		if(ret) log(`command returned ${ret}`);
	} catch(e){console.error(e)}
};

function log(text, raw){
	let div = document.createElement("div");
	if(raw){
		div.innerHTML = text;
	} else {
		let str = text.split("\n");
		for(let frag of str){
			let s = document.createElement("p");
			s.textContent = frag;
			div.appendChild(s);
		}
	};
	body.appendChild(div);
};

