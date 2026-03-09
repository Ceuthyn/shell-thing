let button = document.getElementById("login");

button.onclick = async ()=>{
	let err = document.getElementById("err");

	let user = document.getElementById("username").value;
	let pass = document.getElementById("password").value;
	if(!user || !pass){
		err.textContent = "all fields must be filled";
		return;
	};

	let res = await fetch("/api/login", {
		method: "GET",
		headers:{
			password: pass,
			username: user
		}
	});

	if(res.status == 200){
		sessionStorage.setItem("token", await res.text());
		window.location.replace("/");
	};
	
	if(res.status != 200){
		err.textContent = await res.text();
		return;
	};
};

let reg = document.getElementById("register");

reg.onclick = ()=>{
	window.location.replace("/register");
};
