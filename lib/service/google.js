var translateService;
request = require('request-json');
var md5 = require('md5');

var client;
var map
var url = {}

function init(urls) {
	url = urls;
	var client = request.createClient(url.url);
}

function fetchInitMapData(page) {

	return new Promise((resolve, reject) => {

		var client = request.createClient(url.url);
		let options = {pageNumber: page, pageSize: 10000}
		client.post('translateWithPagination', options).then(async function (results) {
			resolve(results);
		})

	})
}

function initData(page = 1, resolveMaster) {


	return new Promise(async (resolve, reject) => {

		if (!map) {
			map = new Map();
		}

		let results = await fetchInitMapData(page);
		let objc = results.body;

		await objc.list.forEach(async item => {

			if (md5(item.ptBR) == '7215ee9c7d9dc229d2921a40e899ec5f') {
				console.log("setei o vazaio");
			}

			await map.set(md5(item.ptBR), item);


		});

		console.log("terminou de iniciar o map", map.size)

		if (objc.hasNext){
			if (page == 1){
				resolveMaster = resolve;
			}

			page++;

			initData(page, resolveMaster);
		}else{
			resolveMaster();
		}

	})


}


function initMap() {


	return new Promise(async (resolve) => {

		if (!map) {
			await initData();
			resolve();
		}else{
			resolve();
		}
	})


}


// eslint-disable-next-line max-params
function translateObject(language, key, destObj, keysArray, valuesArray) {


	return new Promise(async function (resolve, reject) {


		if (keysArray) {
			for (var i = 0; i < keysArray.length; i++) {

				let keyCache = md5(valuesArray[i]);

				let languageMAP = {
					"pt-br": "ptBR",
					"en": "enUS",
					"es": "es"
				};

				let mapCache = map.get(keyCache);

				if (mapCache && mapCache[languageMAP[language]] != null) {
					destObj[key][keysArray[i]] = mapCache[languageMAP[language]];
				} else {

					let find = false;
					let cont = 0;
					while (!find) {
						try {
							console.log(cont++);

							var client = request.createClient(url.url);

							let bodyData = await  client.post('translate/' + language, [valuesArray[i]]);
							destObj[key][keysArray[i]] = bodyData.body[0];

							let obj = {
								ptBr: valuesArray[i]
							}

							if (mapCache) {
								obj = mapCache
							}

							obj[languageMAP[language]] = bodyData.body[0]

							await map.set(md5(valuesArray[i]), obj);

							find = true;

						} catch (e) {
							console.log(e);
						}
					}


				}

			}
			resolve(destObj);

		} else {
			resolve(destObj);

		}


	});


}

function translateString(language, key, destObj, valueStr) {


	return new Promise(function (resolve, reject) {


		// translateService.translate(valueStr, "pt-br", language, function (err, res) {
		// 	if (err || !res) {
		// 		reject(err);
		// 	} else {
		//
		// 		destObj[key] = res.translatedText;
		// 		resolve(destObj);
		// 	}
		// });


		// let keyCache = md5(valueStr);
		//
		// let languageMAP = {
		// 	"pt-br": "ptBR",
		// 	"en": "enUS",
		// 	"es": "es"
		// };
		//
		// let mapCache = map.get(keyCache);
		//
		// if (mapCache && mapCache[languageMAP[language]] != null) {
		// 	destObj[key] = mapCache[languageMAP[language]];
		resolve(destObj);
		// }else{
		//
		// 	destObj[key] = valueStr;
		// 	resolve(destObj);
		//
		// }


	});
}

module.exports = {
	init: init,
	object: translateObject,
	string: translateString,
	initMap: initMap
};

