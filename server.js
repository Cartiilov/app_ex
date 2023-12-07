const fs = require("fs").promises;
const exists = require("fs").exists;
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
var neo4j = require("neo4j-driver");
const ejs = require("ejs");

const URI = "neo4j+s://66f8e6c7.databases.neo4j.io";
const USER = "neo4j";
const PASSWORD = "YAp1r2HzRWuhJztPtvosCbEv8A9mJCvPOBzMv0SupNs";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));
app.use("/data", express.static("data"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "pages"));

const filePath = path.join(__dirname, "pages", "main.ejs");

var checkRespVal = [""];
var checkRRespVal = [""];
var checkPRespVal = [""];
names = [];

app.get("/", (req, res) => {
	const filePath = path.join(__dirname, "pages", "main.ejs");

	(async () => {
		let driver;

		try {
			const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
			const serverInfo = await driver.getServerInfo();
			console.log("Connection established");
			console.log(serverInfo);
			const { records, summary, keys } = await driver.executeQuery(
				"MATCH (n:Person) RETURN n.name AS name;",
				{ database: "neo4j" }
			);

			console.log(
				`>> The query ${summary.query.text} ` +
					`returned ${records.length} records ` +
					`in ${summary.resultAvailableAfter} ms.`
			);

			names = [];
			console.log(">> Results");
			for (record of records) {
				names.push(record.get("name"));
			}
			res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
		} catch (err) {
			console.log(
				`Error fetching data from Neo4j\n${err}\nCause: ${err.cause}`
			);
			res.status(500).send("Internal Server Error");
		}
	})();
});

app.post("/check", async (req, res) => {
	person1 = req.body.person1;
	person2 = req.body.person2;
	var queryNum;
	var genDivide;
	parent = "";

	checkPRespVal[0] = checkRRespVal[0] = " "
	console.log(person2);
	if (person1.localeCompare(person2) == 0) {
		console.log("A person can't be a parent to themselves!");
		checkRespVal[0] = "This is the same person";
		console.log(names);
		res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
		return;
	} else {
		query1 =
			"MATCH p=shortestPath((:Person {name: '" +
			person1 +
			"'})-[:PARENT_OF]-(:Person {name: '" +
			person2 +
			"'})) RETURN length(p) AS len";
		(async () => {
			let driver;
			try {
				driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
				const serverInfo = await driver.getServerInfo();
				console.log("Connection established");
				console.log(serverInfo);
				const { records, summary, keys } = await driver.executeQuery(query1, {
					database: "neo4j",
				});
				console.log(summary.query.text + " looked for relationship");

				if (typeof records === "undefined") {
					console.log("first failed");
					query2 =
						"MATCH p=shortestPath((:Person {name: '" +
						person2 +
						"'})-[:PARENT_OF*]-(:Person {name: '" +
						person1 +
						"'})) RETURN length(p) AS len";
					const { records, summary, keys } = await driver.executeQuery(query2, {
						database: "neo4j",
					});
					if (typeof records === "undefined") {
						console.log("There is no relation between these people");
						checkRespVal[0] = "There is no relation between these people";
						res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
						return;
					} else {
						queryNum = 2;
						genDivide = parseInt(records[0].get("len"));
						console.log("2 There is " + genDivide + " between these people");
					}
				} else {
					queryNum = 1;
					genDivide = parseInt(records[0].get("len"));
					console.log(
						"1 There is " +
							genDivide +
							" between these people " +
							typeof genDivide
					);
				}
			} catch (err) {
				console.log(`Connection error\n${err}\nCause: ${err.cause}`);
			}

			relationship = "";
			switch (genDivide) {
				case 1:
					relationship = " is a parent to ";
					break;
				case 2:
					relationship = " is a grandparent to ";
					break;
				default:
					relationship = " is a " + genDivide + "'s generation ancestor of ";
			}

			if (queryNum == 1) {
				checkRespVal[0] = person1 + relationship + person2;
			} else {
				checkRespVal[0] = person2 + relationship + person1;
			}
			res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
		})();
	}
});

app.post("/click", async (req, res) => {
	content = req.body.name;
	console.log(content);
	checkRRespVal[0] = checkRespVal[0] = "";
	nodename = content.split(" ")[0]


	const query = "CREATE (" + nodename + ":Person {name: '" + content + "'})";
	(async () => {
		let driver;

		try {
			driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
			const serverInfo = await driver.getServerInfo();
			console.log("Connection established");
			console.log(serverInfo);
			const { records, summary, keys } = await driver.executeQuery(query, {
				database: "neo4j",
			});
			console.log(summary.query.text + " did a thing I guess");
			checkPRespVal[0] = "Add was successful";
		} catch (err) {
			console.log(`Connection error\n${err}\nCause: ${err.cause}`);
			checkPRespVal[0] = "Add was successful";
			
		}
		res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
	})();
});

app.post("/relationship", async (req, res) => {
	person1 = req.body.person1;
	person2 = req.body.person2;
	checkPRespVal[0] = checkRespVal[0] = "";

	console.log(person2);
	if (person1.localeCompare(person2) == 0) {
		console.log("A person can't be a parent to themselves!");
		checkRRespVal[0] = "A person can't be a parent to themselves!";
		res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
		return;
	}

	query =
		'MATCH (p:Person {name: "' +
		person1 +
		'"}), (c:Person {name: "' +
		person2 +
		'"}) CREATE (p)-[:PARENT_OF]->(c)';
	(async () => {
		let driver;

		try {
			driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
			const serverInfo = await driver.getServerInfo();
			console.log("Connection established");
			console.log(serverInfo);
			const { records, summary, keys } = await driver.executeQuery(query, {
				database: "neo4j",
			});
			console.log(summary.query.text + " did a thing I guess");
			checkRRespVal[0] = "Add was successful";
		} catch (err) {
			console.log(`Connection error\n${err}\nCause: ${err.cause}`);
			checkRRespVal[0] = "Add was not successful :(";
			
		}
		res.render(filePath, { neo4jData: names, checkResp: checkRespVal, checkRResp: checkRRespVal, checkPResp: checkPRespVal });
	})();
});

app.listen(3000);
