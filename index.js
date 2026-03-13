let { createHash } = require("node:crypto"); //for password hashing
let sqlite = require("sqlite");
let sqlite3 = require("sqlite3");
let db; 

let express = require("express");
let path = require("node:path");
let serv = express();

serv.use(express.static(path.join(__dirname, "site"))); //not modifying the html so its just static
serv.use(express.raw({type: "*/*"}));

let tokens = {}; //store tokens only while the server is up

let randstringgen = (len)=>{ //BAD DONT DO THIS
	let str = "qwertyuiopasdfghjklzxcvbnm1234567890";
	let token = "";
	for(let i = 0; i<len; i++){
		token += str[Math.floor(Math.random()*str.length)];
	};
	return token;
};

serv.get("/api/login", async (req, res)=>{
	let pass = req.get("password");
	let username = req.get("username");
	if(!pass || !username) return res.status(400).send("bad data");

	let user = await db.get("SELECT * FROM users WHERE username = ?", username);
	if(user == undefined) return res.status(404).send("user doesnt exist");

	let hash = createHash("sha256");
	hash.update(pass + "insecuresaltmethod"); //i cannot be bothered right now
	let hashres = hash.digest("hex");
	if(hashres == user.passwordhash){
		console.log(`succesful login by ${username}`);
		let token = randstringgen(20);
		tokens[token] = user.userid;
		return res.status(200).send(token);
	} else {
		console.log(`unsuccesful login by ${username}`);
		return res.status(400).send("incorrect password");
	};
});

serv.post("/api/register", async (req, res)=>{
	let pass = req.get("password");
	let username = req.get("username");
	if(!pass || !username) return res.status(400).send("bad data")

	let user = await db.get("SELECT * FROM users WHERE username = ?", username);
	if(user != undefined) return res.status(400).send("user already exists");

	let hash = createHash("sha256");
	hash.update(pass + "insecuresaltmethod"); //see previous instance
	let hashres = hash.digest("hex");
	let userid = randstringgen(20);
	await db.run("INSERT INTO users (username, userid, passwordhash) VALUES (?, ?, ?)", username, userid, hashres);
	await db.run("INSERT INTO userdata (userid) VALUES (?)", userid);
	return res.status(200).send("succesful registration");
});

serv.get("/api/restore", async (req, res)=>{
	let token = req.get("x-token");
	if(!token) return res.status(400).send("no token");
	if(tokens[token] == undefined) return res.status(403).send("bad token");
	
	let data = await db.get("SELECT encodeddata FROM userdata WHERE userid = ?", tokens[token]);
	if(data.encodeddata){
		return res.status(200).send(data.encodeddata);
	} else {
		return res.status(200).sendFile(path.join(__dirname, "base.json"));
	};
		
});

serv.post("/api/save", async (req, res)=>{
	let token = req.get("x-token");
	let dat = req.body;
	if(dat == undefined || !token) return res.status(400).send("invalid data");
	if(tokens[token] == undefined) return res.status(400).send("invalid token");
	console.log(await db.run("UPDATE userdata SET encodeddata = ? WHERE userid = ?", dat, tokens[token]));

});

(async ()=>{
	db = await sqlite.open({
		filename: path.join(__dirname, "db.db"),
		driver: sqlite3.Database
	});
})();
serv.listen(4000, ()=>console.log("server started"));
