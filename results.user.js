// ==UserScript==
// @name         Informatics results
// @version      1.1.1
// @description  try to take over the world!
// @author       68958824
// @match        http://informatics.msk.ru/*
// @match        http://informatics.mccme.ru/*
// @grant        none
// ==/UserScript==

defaultArgs = {
	problem_id: 0, // задача, chapterid
	group_id: 0, //5321, // ...
	user_id: 0, // ...
	statement_id: 0, //10887, // ?
	count: 5000,

	lang_id: -1,
	status_id: -1,
	page: 0,
	action: "getHTMLTable",
	objectName: "submits",
	with_comment: ""};

function frm(u, d) {
	f = true;
	for (var key in d) {
		u += (f) ? "?" : "&";
		f = false;
		u += key + "=" + d[key];
	}
	return u;
}

function getU(args) {
	var u = "/moodle/ajax/ajax.php";
	for (var key in defaultArgs) {
		if (args[key] === undefined) args[key] = defaultArgs[key];
	}
	return frm(u, args);
}

function _getResults(args, callback) {
	var u = getU(args);
	console.log("url: " + u);
	xhr = new XMLHttpRequest();
	xhr.open("GET", u, true);
	xhr.responseType = "json";
	xhr.onload = function() {
		data = this.response;
		d = document.createElement("div");
		d.innerHTML = data.result.text;
		table = d.children[1];
		results = {};
		all_res = {};
		for (var i = 1; i < table.rows.length; i++) {
			row = table.rows[i];
			res = {};
			inter = [1, 2, 7];

			var name = row.cells[1].innerText.trim();
			task = row.cells[2].innerText.split(".")[0];
			res = parseInt(row.cells[7].innerText);
			if (res !== 0 && !res) res = "???";
			if (results[name] === undefined) results[name] = {};
			if (results[name][task] === undefined) results[name][task] = res;
			if (typeof(res) == "number") {
				if (typeof(results[name][task]) != "number") results[name][task] = res;
				else results[name][task] = Math.max(results[name][task], res);
			}

			if (all_res[name] === undefined) all_res[name] = {};
			if (all_res[name][task] === undefined) all_res[name][task] = [];
			all_res[name][task].push(res);
		}
		console.log(all_res);
		callback(results);
	};
	xhr.send();
}

function getResults(callback) {
	getArgs(function(args){
		_getResults(args, callback);
	});
}

function getArgs(callback) {
	var u = window.location.pathname + window.location.search.replace("standing", "submit");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", u, true);
	xhr.responseType = "document";
	xhr.onload = (function() {
		callback(getArgsFromPage(this.response));
	});
	xhr.send();
}

function getArgsFromPage(doc) {
	tocheck = ["problem_id", "group_id", "user_id", "statement_id"];
	args = {};
	for (var i = 0; i < tocheck.length; i++) {
		d = doc.getElementById(tocheck[i]);
		if (d) args[tocheck[i]] = d.innerText;
	}
	console.log("args:");
	console.log(args);
	return args;
}

function getTasks() {
	ul = document.getElementsByClassName("statements_toc_alpha")[0].children[0].children[0];
	tasks = [];
	for (var i = 0; i < ul.children.length; i++) {
		u = ul.children[i].children[0].href;
		tasks.push(u.split("chapterid=")[1]);
	}
	return tasks;
}

function fillTable(results) {
	var table = document.getElementsByClassName("BlueTable")[0];
	var tasks = getTasks();
	console.log(results);
	var rows = [];
	var scoreCell = -1;
	for (var i = 0; i < table.rows[0].cells.length; i++) {
		if (~table.rows[0].cells[i].innerText.toLowerCase().indexOf("балл")) {
			scoreCell = i;
			break;
		}
	}
	if (scoreCell == -1) {
		scoreCell = table.rows[0].cells.length;
		for (var r = 0; r < table.rows.length; r++) {
			td = document.createElement("td");
			if (r == 0) td.innerText = "Балл";
			table.rows[r].appendChild(td);
		}
	}
	for (var r = 1; r < table.rows.length; r++) {
		var name = table.rows[r].cells[1].innerText.trim();
		res = 0;
		for (var i = 0; i < tasks.length; i++) {
			if (results[name] === undefined) continue;
			b = results[name][tasks[i]];
			if (b === undefined) continue;
			if (typeof(b) == "number") {
				table.rows[r].cells[2 + i].innerText = b;
				res += b;
			} else if (~table.rows[r].cells[2 + i].innerText.indexOf("+")) {
				res += 100;
			}
		}
		table.rows[r].cells[scoreCell].innerText = res;
		rows.push([res, table.rows[r]]);
	}
	for (r = table.rows.length - 1; r > 0; r--) {
		table.rows[r].parentElement.removeChild(table.rows[r]);
	}
	rows = rows.sort(function (x, y) {
		return parseInt(y[0]) - parseInt(x[0]);
	});
	//console.log(rows);
	for (r = 0; r < rows.length; r++) {
		table.rows[0].parentElement.appendChild(rows[r][1]);
		rows[r][1].cells[0].innerText = r + 1;
	}
}

//getArgsFromPage(document)
//getResults(getArgs(), (d)=>(console.log(d)));
/*
getResults(function(ress) {
	console.log(ress);
});
*/

if (~window.location.search.indexOf("standing")) {
	getResults(fillTable);
}
