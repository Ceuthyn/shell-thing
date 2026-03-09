let button = document.getElementById("register");

button.onclick = async ()=>{
	let err = document.getElementById("err");

	let user = document.getElementById("username").value;
	let pass = document.getElementById("password").value;
	let passc = document.getElementById("password-c").value;
	if(!user || !pass || !passc){
		err.textContent = "all fields must be filled";
		return;
	};

	if(pass != passc){
		err.textContent = "entered passwords do not match"
		return;
	}

	let res = await fetch("/api/register", {
		method: "POST",
		headers:{
			password: pass,
			username: user
		}
	});

	if(res.status == 200){
		err.textContent = "succesfully registered, redirecting...";
		setTimeout(()=>{
			window.location.replace("/login");
		}, 2500);
	};
	
	if(res.status == 400){
		err.textContent = await res.text();
		return;
	};
};
